import Constants from "./constants.js";

export default class Notifications {
  currentAffiliationNoticationOnClickedListener = undefined;
  currentRedirectNoticationOnClickedListener = undefined;

  removeAllEventListeners() {
    if (this.currentAffiliationNoticationOnClickedListener) {
      chrome.action.onClicked.removeListener(this.currentAffiliationNoticationOnClickedListener);
      chrome.notifications.onClicked.removeListener(this.currentAffiliationNoticationOnClickedListener);
    }
    if (this.currentNoticationOnClickedListener) {
      chrome.notifications.onClicked.removeListener(this.currentNoticationOnClickedListener);
    }
  }
  
  notifyOfRedirect(tabId) {
    var id = Constants.NOTIFICATION_ID + 'redirected-' + tabId;

    chrome.notifications.create(id, {
      type: 'basic',
      title: 'Sponsoring van C.S.V. Alpha geactiveerd!',
      message: 'C.S.V. Alpha ontvangt commissie als op op deze website iets koopt.',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png')
    });

    this.removeAllEventListeners();
    this.currentNoticationOnClickedListener = (notificationId) => {
      if (notificationId === id) {
        chrome.notifications.clear(notificationId);
      }
    };
    chrome.notifications.onClicked.addListener(this.currentNoticationOnClickedListener);
  }

  notifyOfAffiliation(functions, tabId, siteName, originalUrl, sponsorUrl) {
    var id = Constants.NOTIFICATION_ID + 'affiliation-' + tabId;

    chrome.notifications.create(id, {
      type: 'basic',
      title: siteName + ' heeft ook een gesponsorde link!',
      message: 'Klik op deze notificatie of de icoon van de extensie om via die link te gaan.',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png')
    });

    this.removeAllEventListeners();
    this.currentAffiliationNoticationOnClickedListener = notificationId => {
      if (notificationId === id || (notificationId.hasOwnProperty('id') && notificationId.id === tabId)) {
        chrome.notifications.clear(id);
        functions.sponsoredTabs[tabId] = { 'hostname': originalUrl.hostname, 'referrer': originalUrl.toString() };
        functions.navigateTo(tabId, sponsorUrl);
      }
    };
    chrome.action.onClicked.addListener(this.currentAffiliationNoticationOnClickedListener);
    chrome.notifications.onClicked.addListener(this.currentAffiliationNoticationOnClickedListener);
  }
}