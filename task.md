# Feature B: Squad Checkouts & Fractional Bill Splitting — Checklist

## 1. Backend Implementation
- [x] Update `createBooking` in `bookingController.js` to support `is_split_payment` & auto-generate squads
- [x] Update `getSquadDetails` in `squadController.js` to return booking details & payment state
- [x] Enhance `joinSquad` in `squadController.js` to assert squad size limits and set member amount owed
- [x] Create `payMemberShare` endpoint in `squadController.js` to confirm member payment and confirm booking if fully paid
- [x] Register the `pay-share` route in `squadRoutes.js`

## 2. Frontend Implementation
- [x] Update Event Detail page (`EventDetail.jsx`) checkout modal with split payment toggle options
- [x] Redesign Squad Detail page (`SquadDetail.jsx`) to render the payment widget, progress bar, and card forms
- [x] Overhaul member checklist styling in `SquadDetail.css` for unpaid vs paid states

## 3. Verification
- [x] Run production builds and perform tests
