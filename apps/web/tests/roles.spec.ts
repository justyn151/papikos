import { expect, test } from "@playwright/test";

import { openRequestDialog, waitForReady } from "./helpers";

async function switchRole(
  page: import("@playwright/test").Page,
  label: "Penyewa" | "Pemilik kos" | "Admin",
) {
  await page.getByRole("button", { name: label, exact: true }).click();
}

test("a rental request travels from renter to owner and back", async ({
  page,
}) => {
  // The whole premise of the prototype store: renter submissions are real
  // records the owner can act on, and the decision returns to the renter.
  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);

  await openRequestDialog(page);
  await page.getByRole("button", { name: "Kirim permintaan" }).click();
  await expect(
    page.getByRole("heading", { name: "Permintaan sewa terkirim" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tutup" }).click();

  // Renter sees it as pending.
  await page.goto("/permintaan");
  await waitForReady(page);
  await expect(page.getByText("Papikos Senja Setiabudi")).toBeVisible();
  await expect(page.getByText("Menunggu").first()).toBeVisible();

  // Owner sees the same record and approves it.
  await switchRole(page, "Pemilik kos");
  await page.goto("/pemilik/permintaan");
  await waitForReady(page);
  await expect(page.getByText("Papikos Senja Setiabudi")).toBeVisible();
  await page.getByRole("button", { name: "Setujui" }).click();
  await expect(page.getByText("Sudah diputuskan")).toBeVisible();

  // The decision is visible to the renter, with both history entries kept.
  await switchRole(page, "Penyewa");
  await page.goto("/permintaan");
  await waitForReady(page);
  await expect(page.getByText("Disetujui").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Batalkan permintaan" }),
  ).toHaveCount(0);

  await page.getByText("Riwayat status").click();
  await expect(page.getByText("oleh pemilik")).toBeVisible();
});

test("an owner answer reaches the kos page", async ({ page }) => {
  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);

  await page
    .getByLabel("Pertanyaanmu")
    .fill("Apakah ada jam malam untuk penghuni?");
  await page.getByRole("button", { name: "Kirim pertanyaan" }).click();
  await expect(
    page.getByText("Pertanyaan tersimpan untuk pemilik (prototipe)."),
  ).toBeVisible();

  // A pending question stays private between renter and owner.
  await page.reload();
  await waitForReady(page);
  await expect(
    page.getByText("Apakah ada jam malam untuk penghuni?"),
  ).toHaveCount(0);

  await page.goto("/pemilik/tanya-jawab");
  await waitForReady(page);
  await page.getByLabel("Jawabanmu").fill("Tidak ada jam malam, akses 24 jam.");
  await page.getByRole("button", { name: "Kirim jawaban" }).click();

  // Once answered it becomes useful to everyone.
  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  await expect(
    page.getByText("Apakah ada jam malam untuk penghuni?"),
  ).toBeVisible();
  await expect(
    page.getByText("Tidak ada jam malam, akses 24 jam."),
  ).toBeVisible();
});

test("an admin suspension removes a kos from renter search and is audited", async ({
  page,
}) => {
  await page.goto("/admin/kos");
  await waitForReady(page);

  const row = page
    .locator("li")
    .filter({ hasText: "Papikos Senja Setiabudi" })
    .first();
  await row.getByRole("button", { name: "Tangguhkan" }).click();
  await expect(row.getByText("Ditangguhkan")).toBeVisible();

  await page.goto("/kos");
  await waitForReady(page);
  await expect(page.getByText("Papikos Senja Setiabudi")).toHaveCount(0);
  await expect(page.getByText("Kos Asri Dago")).toBeVisible();

  await page.goto("/admin/audit");
  await waitForReady(page);
  await expect(page.getByText("listing.suspended")).toBeVisible();
  await expect(page.getByText("senja-setiabudi")).toBeVisible();
});

test("saved kos are listed on the favorites page", async ({ page }) => {
  await page.goto("/kos");
  await waitForReady(page);

  const firstCard = page.locator(".listing-card").first();
  const name = await firstCard.locator("h3").innerText();
  await firstCard.getByRole("button", { name: "Simpan ke favorit" }).click();

  await page.getByRole("link", { name: "Kos favorit" }).click();
  await expect(page).toHaveURL(/\/favorit$/);
  await expect(page.getByText(name)).toBeVisible();

  await page.getByRole("button", { name: "Hapus dari favorit" }).click();
  await expect(page.getByText("Belum ada kos favorit")).toBeVisible();
});

test("a cost row explains itself and rules out in-app payment", async ({
  page,
}) => {
  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);

  await page
    .getByRole("button", { name: "Listrik — Lihat penjelasan biaya" })
    .click();

  const dialog = page.getByRole("dialog", { name: "Penjelasan biaya" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/meteran/)).toBeVisible();
  await expect(dialog.getByText(/tidak memproses pembayaran/)).toBeVisible();
});

test("an owner edit reaches renter search, filtering, and the audit trail", async ({
  page,
}) => {
  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);

  await page.getByLabel("Nama kos").fill("Kos Senja Diperbarui");
  // The headline price follows the cheapest room, and the discount is a
  // percentage, so both are set through what the owner actually decides.
  await page.getByLabel("Harga", { exact: true }).first().fill("2000000");
  await page.getByLabel("Diskon (%)").fill("15");
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByText("Perubahan tersimpan.")).toBeVisible();

  await page.goto("/kos?q=Senja");
  await waitForReady(page);
  const card = page.locator(".listing-card").first();
  await expect(card).toContainText("Kos Senja Diperbarui");
  await expect(card).toContainText("-15%");
  await expect(card).toContainText("Rp 1.700.000");

  // The discounted price, not the list price, is what a budget filter matches.
  await page.goto("/kos?max=1800000");
  await waitForReady(page);
  await expect(page.getByText("Kos Senja Diperbarui")).toBeVisible();

  await page.goto("/admin/audit");
  await waitForReady(page);
  await expect(page.getByText("listing.edited")).toBeVisible();
});

test("resetting an edit restores the seeded listing", async ({ page }) => {
  await page.goto("/pemilik/kos/asri-dago");
  await waitForReady(page);

  await page.getByLabel("Nama kos").fill("Nama Sementara");
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByText("Perubahan tersimpan.")).toBeVisible();

  await page.getByRole("button", { name: "Kembalikan ke data awal" }).click();
  await expect(page.getByLabel("Nama kos")).toHaveValue("Kos Asri Dago");

  await page.goto("/kos?q=Dago");
  await waitForReady(page);
  await expect(page.getByText("Kos Asri Dago")).toBeVisible();
});

test("an approved request shows up as owner earnings net of commission", async ({
  page,
}) => {
  await page.goto("/pemilik");
  await waitForReady(page);
  await expect(page.getByText("dari 0 permintaan disetujui")).toBeVisible();

  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  await openRequestDialog(page);
  await page.getByRole("button", { name: "Kirim permintaan" }).click();
  await page.getByRole("button", { name: "Tutup" }).click();

  await page.goto("/pemilik/permintaan");
  await waitForReady(page);
  await page.getByRole("button", { name: "Setujui" }).click();
  await expect(page.getByText("Sudah diputuskan")).toBeVisible();

  await page.goto("/pemilik");
  await waitForReady(page);
  await expect(page.getByText("dari 1 permintaan disetujui")).toBeVisible();

  // Gross, the platform's cut, and what actually reaches the owner are all
  // shown; the commission is what makes the last two differ.
  const earnings = page
    .locator("section")
    .filter({ hasText: "Pendapatan bulan ini" })
    .first();
  await expect(earnings.getByText("Pendapatan kotor")).toBeVisible();
  await expect(earnings.getByText("Komisi Papikos")).toBeVisible();
  await expect(earnings.getByText("Diterima pemilik")).toBeVisible();
  await expect(earnings.getByText(/Papikos tidak menerima/)).toBeVisible();
  await expect(earnings.getByText("Rp 0")).toHaveCount(0);
});

test("an uploaded photo becomes the kos cover and survives a reload", async ({
  page,
}) => {
  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);

  await expect(page.getByText("Belum ada foto")).toBeVisible();
  await page.getByLabel("Tambah foto").setInputFiles({
    name: "kamar.png",
    mimeType: "image/png",
    // A 1x1 PNG: enough for the browser to decode, downscale, and re-encode.
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await expect(page.getByText("1 dari 20 foto")).toBeVisible();
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByText("Perubahan tersimpan.")).toBeVisible();

  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  await expect(page.getByRole("img", { name: "Foto pemilik 1" })).toBeVisible();

  await page.reload();
  await waitForReady(page);
  await expect(page.getByRole("img", { name: "Foto pemilik 1" })).toBeVisible();
});

test("a custom house rule reaches renters alongside the standard ones", async ({
  page,
}) => {
  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);

  await page.getByLabel("Peraturan tambahan").fill("Jam tamu maksimal 21.00");
  await page.getByRole("button", { name: "Tambah peraturan" }).click();
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByText("Perubahan tersimpan.")).toBeVisible();

  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  const rules = page
    .locator("section")
    .filter({ hasText: "Peraturan kos" })
    .first();
  await expect(rules.getByText("Jam tamu maksimal 21.00")).toBeVisible();
  // The standard set is not replaced by the custom one.
  await expect(rules.getByText("Tamu wajib melapor")).toBeVisible();
});

test("a room the owner adds is bookable, and the last one cannot be deleted", async ({
  page,
}) => {
  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);

  await page.getByRole("button", { name: "Tambah kamar" }).click();
  await page.getByLabel("Nama kamar").last().fill("Kamar Atas");
  await page.getByLabel("Harga", { exact: true }).last().fill("3000000");
  await page.getByLabel("Kamar kosong").last().fill("2");
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByText("Perubahan tersimpan.")).toBeVisible();

  // The renter sees the new room in the comparison and can request it.
  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  await expect(page.getByText("Kamar Atas").first()).toBeVisible();

  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);
  for (const name of ["Kamar Atas", "Kamar Plus", "Kamar Standard"]) {
    await page.getByRole("button", { name: `Hapus kamar: ${name}` }).click();
  }

  // A kos with no rooms cannot be priced or rented, so the last one stays.
  await expect(page.getByText("Kos harus punya minimal satu kamar.")).toBeVisible();
  await expect(page.getByLabel("Nama kamar")).toHaveCount(1);
});

test("a cost the owner adds reaches renters with the reason behind it", async ({
  page,
}) => {
  await page.goto("/pemilik/kos/senja-setiabudi");
  await waitForReady(page);

  await page.getByLabel("Tambah biaya").fill("Iuran kebersihan");
  await page.getByRole("button", { name: "Tambah biaya" }).click();
  await page
    .getByLabel("Penjelasan: Iuran kebersihan")
    .fill("Ditagih tiap awal bulan bersama listrik.");
  await page.getByLabel("Nominal").last().fill("50000");
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByText("Perubahan tersimpan.")).toBeVisible();

  await page.goto("/kos/senja-setiabudi");
  await waitForReady(page);
  await page
    .getByRole("button", { name: "Iuran kebersihan — Lihat penjelasan biaya" })
    .click();

  // Papikos has no seeded copy for a charge it has never heard of, so the
  // owner's own words are the only explanation there is.
  const dialog = page.getByRole("dialog", { name: "Penjelasan biaya" });
  await expect(dialog.getByText("Ditagih tiap awal bulan bersama listrik.")).toBeVisible();
  await expect(dialog.getByText(/tidak memproses pembayaran/)).toBeVisible();
});
