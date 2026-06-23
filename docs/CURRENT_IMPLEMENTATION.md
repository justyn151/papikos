# Papikos Current Frontend Implementation

This document describes the frontend as it currently exists. It complements the longer beginner and API guides.

## 1. Current source structure

    src/
      components/
        AboutPapikos/
        Header/
        KosDetailPage/
        KosGallery/
        MediaLightbox/
        PaymentBreakdownModal/
        SearchHero/
      data/
        kosListings.ts
      pages/
        HomePage.tsx
      styles/
        global.css
      types/
        kos.ts
      utils/
        formatCurrency.ts
      App.tsx
      main.tsx

Static browser assets:

    public/
      videos/
        kos-tour.mp4

The original supplied MKV video remains in the root videos folder. A browser-compatible MP4 version is served from public/videos.

## 2. Main data model

The main type is KosListing, not KosPhoto.

A listing represents the complete frontend record:

    export type KosListing = {
      id: number
      title: string
      location: string
      monthlyPrice: number
      rating: number
      tag: string
      address: string
      description: string
      facilities: string[]
      facilityCategories: FacilityCategory[]
      rules: string[]
      roomSize: string
      availableRooms: number
      owner: string
      paymentTerms: PaymentTerms
      imageUrl: string
      imageAlt: string
      media: KosMedia[]
    }

Why this name is appropriate:

- It contains much more than a photo.
- It represents one item offered to potential tenants.
- It maps naturally to a backend listing response.

## 3. Facility categories

Short facility highlights are stored in facilities:

    facilities: [
      'AC',
      'Wi-Fi',
      'Kamar mandi dalam',
    ]

These appear in the compact information card.

Complete facilities use facilityCategories:

    facilityCategories: [
      {
        id: 'kamar',
        title: 'Fasilitas kamar',
        items: ['AC', 'Kasur', 'Meja'],
      },
      {
        id: 'kamar-mandi',
        title: 'Fasilitas kamar mandi',
        items: ['Kloset duduk', 'Shower'],
      },
    ]

The category title is data rather than hard-coded JSX. A future owner form can therefore create custom categories.

Recommended backend behavior:

- Validate category-title length.
- Validate item count and item length.
- Preserve category and item ordering.
- Sanitize text before storage or display.

## 4. Media model

Each listing owns a media array:

    export type KosMedia = {
      id: string
      label: string
      type: 'image' | 'video'
      url: string
      thumbnailUrl?: string
      alt: string
    }

Example:

    media: [
      {
        id: 'video-tour',
        label: 'Video tour',
        type: 'video',
        url: '/videos/kos-tour.mp4',
        thumbnailUrl: 'https://example.com/cover.jpg',
        alt: 'Video tour interior kos',
      },
      {
        id: 'bedroom',
        label: 'Kamar tidur',
        type: 'image',
        url: 'https://example.com/bedroom.jpg',
        alt: 'Kamar tidur kos',
      },
    ]

This array is the single source of truth for:

- Main media viewer.
- Thumbnail rail.
- Previous and next navigation.
- Fullscreen media lightbox.
- Current/total index.

The current sample repeats cover images because additional real images have not been supplied yet.

If media is empty, KosDetailPage creates a temporary cover-image fallback so the viewer does not crash.

## 5. Local video asset

The supplied file was:

    videos/VANKCS.mkv

MKV is not reliably supported by web browsers. It was repackaged as:

    public/videos/kos-tour.mp4

The H.264 video stream was copied without recompression. Opus audio was converted to AAC for broader browser support. Fast-start metadata was placed at the beginning of the MP4.

The HTML video player uses:

- controls for native browser controls.
- playsInline for mobile playback.
- preload="metadata" to avoid downloading the entire file immediately.
- poster for the preview image.

For production, media should normally be hosted in object storage or a media service rather than bundled in the frontend deployment.

## 6. Home-to-detail navigation

HomePage owns:

    const [selectedKos, setSelectedKos] =
      useState<KosListing | null>(null)

KosGallery receives setSelectedKos as onShowDetail.

Click flow:

    Lihat detail
      -> onShowDetail(listing)
      -> setSelectedKos(listing)
      -> HomePage renders KosDetailPage

Back flow:

    Kembali ke beranda
      -> onBack()
      -> setSelectedKos(null)
      -> HomePage renders home content

When a detail page opens, a useEffect smoothly scrolls the browser to the top.

This is state-based screen switching, not URL routing. React Router is a useful future improvement.

## 7. Home carousel

KosGallery presents recommended listings.

Important behavior:

- Five logical slides are rendered around the active index.
- Indexes wrap infinitely.
- The center card moves toward the viewer with 3D perspective.
- Side cards sit farther back.
- Arrow buttons and pointer dragging change the active listing.
- Pointer velocity helps quick flick gestures complete naturally.
- Text and images are not selectable during dragging.
- Discount information is displayed only when discountPercentage is above zero.
- Cards without a discount reserve the same vertical row height to maintain alignment.

The carousel uses refs for DOM measurement and pointer bookkeeping, and state for visible position and animation status.

## 8. Detail-page media viewer

The main viewer uses a fixed 16:9 frame.

Images and videos use object-contain. This prevents cropping. Media with a different aspect ratio receives neutral black letterboxing.

Main controls:

- Previous and next arrows appear on hover.
- They remain visible on mobile, where hover is unavailable.
- Clicking an image opens the fullscreen viewer.
- Video uses native controls and does not use a fake play button.

Thumbnail behavior:

- Thumbnails are displayed in a horizontally clipped rail.
- The native scrollbar is hidden.
- The selected thumbnail receives a green border.
- Changing media with the main arrows automatically centers the active thumbnail.
- A thumbnail may be clicked directly.

The rail intentionally has no separate navigation buttons because the main viewer controls are enough.

## 9. Fullscreen media lightbox

MediaLightbox supports images and video.

It receives:

    media: KosMedia
    currentIndex: number
    totalCount: number
    onPrevious: () => void
    onNext: () => void
    onClose: () => void

Features:

- Fixed dark backdrop.
- Scale-and-fade entrance.
- Matching exit animation.
- 16:9 capped frame.
- object-contain media.
- Index above the frame, such as 2 / 6.
- Caption below the frame.
- Previous and next controls.
- Arrow-key navigation.
- Escape-key closing.
- Close button.
- Clicking outside the visible media closes it.
- Clicking the media or controls keeps it open.

The index uses:

    currentIndex + 1

Arrays are zero-based, while user-facing numbering begins at one.

The total is calculated from:

    mediaItems.length

No hard-coded image count is required.

## 10. Detail-page information layout

Desktop uses two columns:

- Left: media, thumbnails, specifications, complete facilities, rules, and owner.
- Right: compact listing information and pricing.

The first right card contains:

- Type and rating.
- Name.
- Address.
- Description.
- Highlight facilities.
- Jadwalkan survey.
- Hubungi pemilik.

The second right card contains:

- Base rental price.
- Rental duration.
- Full/DP selection.
- Payment summary.
- Ajukan sewa.

The price card uses position sticky on large screens. It remains in normal document flow until reaching the configured top position, then follows the user within the detail section.

Global horizontal overflow uses overflow-x: clip rather than hidden. An overflow ancestor using hidden can interfere with nested sticky positioning.

## 11. Currency formatting

Prices are stored as numbers:

    monthlyPrice: 891000

They are formatted with formatRupiah:

    formatRupiah(891000)

Result:

    Rp891.000

Storing numeric values makes calculation, sorting, filtering, and backend integration possible.

Do not store values such as:

    'Rp891.000 / bulan'

inside fields used for calculations.

## 12. Rental periods

Supported frontend periods:

- One month.
- Three months.
- Six months.
- Twelve months.

The selected base rental total is:

    monthlyPrice × rentalMonths

The selection defaults to one month.

Current frontend totals do not include duration-specific discounts. If the business later offers a six-month or yearly discount, the backend quote should return it explicitly.

## 13. Payment terms

Each sample listing contains:

    export type PaymentTerms = {
      dpPercentage: number
      serviceFee: number
      adminFee: number
      deposit: number
      discountPercentage: number
    }

These values currently simulate data that should eventually come from the backend.

Current formulas:

    rentalTotal =
      monthlyPrice × rentalMonths

    discount =
      rentalTotal × discountPercentage / 100

    dpRent =
      rentalTotal × dpPercentage / 100

    dpFirstPayment =
      dpRent + serviceFee

    settlement =
      remainingRent
      + adminFee
      + deposit
      + serviceFee
      - discount

    fullPayment =
      rentalTotal
      + adminFee
      + deposit
      + serviceFee
      - discount

These are frontend estimates only.

The backend must calculate and return the authoritative quote. A user can modify frontend JavaScript and must never be trusted to submit a total.

## 14. Payment interactions

The price card offers:

- Bayar penuh.
- Bayar pakai DP.

Clickable rows include:

- Uang muka.
- Pelunasan.
- Pembayaran penuh.

Rows use pointer cursors and hover feedback.

Clicking a row opens PaymentBreakdownModal.

The modal displays:

- Individual charge lines.
- Discounts in green.
- Total label and amount.
- A warning that the frontend amount is an estimate.

It supports:

- Animated entrance.
- Animated exit.
- Backdrop closing.
- Close button.
- Escape key.

## 15. Login header

Logged-out UI currently displays an outlined Masuk button.

Header accepts an optional onLogin callback:

    type HeaderProps = {
      onLogin?: () => void
    }

No real authentication is implemented yet.

Frontend responsibility:

- Login form.
- Loading and error UI.
- Calling authentication endpoints.
- Displaying session state.

Backend responsibility:

- Password hashing and verification.
- Session or token creation.
- Authorization.
- Secure cookies.
- Database persistence.

## 16. Responsive behavior

Important responsive safeguards:

- Root elements are capped to viewport width.
- Horizontal overflow uses clip.
- Flex/grid children use min-w-0 where necessary.
- Search controls stack on mobile.
- Typography becomes smaller and wraps.
- Media uses responsive 16:9 frames.
- Lightbox media is capped by viewport height.
- Sticky pricing is desktop-only.
- Thumbnail selection automatically follows current media.

The interface was verified at a 412 × 915 mobile viewport during development.

## 17. Global interaction styling

Clickable elements receive pointer cursors globally:

    button
    a
    select
    summary
    label[for]
    [role='button']

Disabled controls receive not-allowed.

This is a convenience. Components should still use semantic buttons and links rather than clickable div elements.

## 18. Current temporary behavior

The following features are frontend simulations:

- Search results.
- Login.
- Survey scheduling.
- Owner contact.
- Rental application.
- Favorites.
- Payment quote.
- Discounts and fees.

They update local messages or state but do not persist.

Before production:

- Replace sample listings with API responses.
- Add real URLs for each listing.
- Fetch authoritative payment quotes.
- Authenticate protected actions.
- Upload and store actual listing media.
- Add loading, error, and empty states.

## 19. Recommended next refactors

Useful next steps:

1. Add React Router.
2. Move media viewer logic into a custom hook.
3. Move quote calculations behind an API.
4. Add AuthContext or a server-state library.
5. Create owner listing forms.
6. Add runtime response validation.
7. Add component and integration tests.
8. Replace repeated sample images.
9. Add reduced-motion support.
10. Lazy-load large media.

## 20. Validation commands

Run after changes:

    npm run lint
    npm run build

lint checks code quality and React hook rules.

build runs TypeScript and creates the production bundle.
