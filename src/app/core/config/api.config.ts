/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Development flags for easier testing
export const SKIP_LOGIN_IN_DEV = false; // Set to true to auto-login with default credentials
export const SKIP_PHONE_REGISTER_IN_DEV = false; // Set to true to auto-register phone with default number
export const DISABLE_MFA_IN_DEV = false; // Set to false to enable MFA

export const API_CONFIG = {
  /** Fallback before VerticalService.init(); runtime uses vertical_api_url */
  baseUrl: 'https://demo.api.titletoolbox.com/webservices',
  storageBaseUrl: 'https://demo.api.titletoolbox.com',
  userPicLocation: 'ttb-storage/demo/user_pic',
  endpoints: {
    login: '/login.json',
    sendMfaOtp: '/send_mfa_otp.json',
    verifyMfaOtp: '/verify_mfa_otp.json',
    getUserWallet: '/get_user_wallet.json',
    showBillingProfile: '/show_billing_profile.json',
    cancelSubscription: '/cancel_subscription.json',
    listSubscriptionOptions: '/list_subscription_options.json',
    getUserSettings: '/get_user_settings.json',
    saveUserSettings: '/save_user_settings.json',
    showPurchaseHistory: '/show_purchase_history.json',
    orderPipeline: '/order_pipeline/page',
    userPipeline: '/user_pipeline',
    searchUserPipeline: '/search_user_pipeline/limit:1000',
    listOffices: '/list_offices',
    searchOffice: '/search_office.json',
    userUsageReport: '/usage_report',
    getFarmMetainfo: '/get_farm_metainfo.json',
    getFarmMetainfoById: '/get_farm_metainfo',
    getFarm: '/get_farm',
    updateFarm: '/update_farm.json',
    removeFarm: '/remove_farm.json',
    renameFarm: '/rename_farm.json',
    loadEditUser: '/load_edit_user.json',
    editUser: '/edit_user.json',
    changePassword: '/change_password.json',
    removeUserPic: '/remove_user_pic.json',
    uploadUserPic: '/upload_user_pic.json',
    autocompleteFips: '/autocomplete_fips.json',
    searchProperty: '/search_property/ttb.json',
    searchOwner: '/search_owner_name/ttb.json',
    searchParcel: '/search_parcel_number/ttb.json',
    getExtraInfoBrief: '/get_extra_info_brief.json',
    getStates: '/get_states',
    getCounties: '/get_counties',
    getSavedQueries: '/get_saved_queries.json',
    getSavedQueryById: '/get_saved_queries',
    renameQuery: '/rename_query.json',
    removeQuery: '/remove_query.json',
    getNetsheetList: '/get_netsheet_list.json',
    deleteNetsheet: '/delete_netsheet.json',
    getSearchFields: '/get_search_fields.json',
    globalSearchCount: '/global_search_count.json',
    globalSearch: '/global_search.json',
    saveQuery: '/save_query.json',
    getCommonQueries: '/get_common_queries.json',
    saveCommonQuery: '/save_common_query.json',
    renameCommonQuery: '/rename_common_query.json',
    removeCommonQuery: '/remove_common_query.json',
    sendData: '/send_data.json',
    recsPurchase: '/recs_purchase.json',
    creditPurchase: '/credit_purchase.json',
    almFetchConfig: '/alm_fetch_config.json',
    almSaveConfig: '/alm_save_config.json',
    updateResult: '/update_result.json',
    clearGlobalSearch: '/clear_global_search.json',
    contactLookup: '/contact_lookup.json'
  }
} as const;

