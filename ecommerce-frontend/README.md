# Clementine Store — Frontend

This directory contains the client application for Clementine Store: a production-ready React application built with Vite. The frontend implements product browsing, search and filters, cart management, checkout flows, user sessions, and administrative product management views.

Project structure
```
ecommerce-frontend/
|-- .gitignore
|-- Edit.jsx
|-- eslint.config.js
|-- index.html
|-- package.json
|-- README.md
|-- vite.config.js
|-- public/
|   |-- icons/
|   |-- illustrations/
|   `-- images/
|       |-- about_us/
|       |-- home/
|       `-- sponsored/
|-- src/
|   |-- App.css
|   |-- App.jsx
|   |-- index.css
|   |-- main.jsx
|   |-- assets/
|   |-- components/
|   |   |-- ScrollToTop.jsx
|   |   |-- account_avatar/
|   |   |   |-- AccountAvatar.css
|   |   |   `-- AccountAvatar.jsx
|   |   |-- admin_manage_products/
|   |   |   |-- admin_cat_list/
|   |   |   `-- admin_product_grid/
|   |   |-- auth/
|   |   |   |-- RequireAdmin.jsx
|   |   |   `-- SessionExpiryHandler.jsx
|   |   |-- breadcrumbs/
|   |   |   |-- breadcrumbs.css
|   |   |   `-- Breadcrumbs.jsx
|   |   |-- cart/
|   |   |   |-- cart_list/
|   |   |   `-- cart_list_item/
|   |   |-- filters/
|   |   |   |-- PriceRangeSlider.css
|   |   |   `-- PriceRangeSlider.jsx
|   |   |-- footer/
|   |   |   |-- footer.css
|   |   |   `-- Footer.jsx
|   |   |-- image_zoom/
|   |   |   |-- ZoomImage.css
|   |   |   `-- ZoomImage.jsx
|   |   |-- modals/
|   |   |   |-- ErrorModal.css
|   |   |   |-- ErrorModal.jsx
|   |   |   |-- checkout_conflict/
|   |   |   |-- session_expired/
|   |   |   `-- success_modal/
|   |   |-- nabar/
|   |   |   |-- navbar.css
|   |   |   `-- Navbar.jsx
|   |   |-- pagination/
|   |   |   |-- PaginationBar.css
|   |   |   `-- PaginationBar.jsx
|   |   `-- products_grid/
|   |       |-- ProdGrid.css
|   |       |-- ProdGrid.jsx
|   |       `-- prod_card/
|   |-- hooks/
|   |   |-- useAccordionData.jsx
|   |   |-- useFetchAutocomplete.js
|   |   |-- useFetchBrowseProducts.js
|   |   |-- useFetchCategoriesWithImages.js
|   |   |-- useFetchCategoryNames.js
|   |   |-- useFetchMe.js
	|   |-- useFetchMyOrders.js
|   |   |-- useFetchMyShippingDetails.js
|   |   |-- useFetchNewProducts.js
|   |   |-- useFetchProductDetails.js
|   |   |-- useFetchProductReviews.js
|   |   |-- usePostProductReview.js
|   |   |-- useUpdateOrderShipping.js
|   |   |-- admin_dashboard/
|   |   |   |-- useFetchTopCategories.js
|   |   |   |-- categories/
|   |   |   |-- inventory/
|   |   |   `-- products/
|   |   |-- for_cart/
|   |   |   |-- CartContext.jsx
|   |   |   |-- useAddCartItem.js
|   |   |   |-- useCreateOrder.js
|   |   |   |-- useDeleteCartItem.js
|   |   |   |-- useFetchCart.js
|   |   |   |-- useLatestOrder.js
|   |   |   |-- usePatchPendingOrder.js
|   |   |   |-- useRevertCheckout.js
|   |   |   `-- useUpdateCartItemQuantity.js
|   |   |-- home_features/
|   |   |   `-- useHomeFeatures.js
|   |   |-- payment/
|   |   |   |-- useConfirmPaymentIntent.js
|   |   |   |-- useCreatePaymentIntent.js
|   |   |   |-- useSavedPaymentCards.js
|   |   |   `-- useShippingReuseOptions.js
|   |   |-- profile/
|   |   |   `-- ...
|   |   |-- support/
|   |   |   `-- ...
|   |   `-- use_auth/
|   |       `-- ...
|   |-- pages/
|   |   |-- about_us/
|   |   |   `-- ...
|   |   |-- account/
|   |   |-- account_dashboard/
|   |   |-- admin/
|   |   |-- auth/
|   |   |-- cart/
|   |   |-- checkout/
|   |   |-- home/
|   |   |-- product_page/
|   |   |-- shopping/
|   |   `-- support/
|   `-- utils/
|       |-- apiFetch.js
|       |-- notes.txt
|       `-- slugUtils.js
```
	pages/
		about_us/
			...
		account/
		account_dashboard/
		admin/
		auth/
		cart/
		checkout/
		home/
		product_page/
		shopping/
		support/
	utils/
		apiFetch.js
		notes.txt
		slugUtils.js
```

