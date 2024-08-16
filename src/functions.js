import Constants from "./constants.js";
import Notifications from "./notifications.js";
import AdditionalSponsoredWebsites from "./additional_sponsored_websites.js";

export default class Functions {
  filter = { url: [] };
  sponsoredTabs = {};
  notifications = new Notifications();

  /**
   * Check if we should update the websites with affiliate links from the API
   * Links are updated every 24 hours
   */
  async checkUpdateUrls() {
    chrome.storage.local.get([Constants.SPONSOR_DOMAINS_STORAGE_KEY, Constants.LASTCHECK_KEY]).then(async (storage) => {
        if (typeof storage[Constants.SPONSOR_DOMAINS_STORAGE_KEY] !== 'undefined') {
            const lastCheck = storage[Constants.LASTCHECK_KEY] || 0;
            if (lastCheck < unixDayAgo()) {
                chrome.storage.local.set({
                    [Constants.LASTCHECK_KEY]: unixTime(new Date()),
                });
                await this.updateUrls();
            }
        } else {
          await this.updateUrls();
        }
    });
  }

  /**
   * Get all the websites with affiliate links from the API
   */
  async updateUrls() {
    const response = await fetch(Constants.API);
    const data = await response.json();

    // Add custom targets that are not present in the API
    // for (var url in CUSTOM_TARGETS) {
    //   var custom_data = CUSTOM_TARGETS[url];
    //   custom_data['orig_url'] = url;
    //   data['webshops'].push(custom_data)
    // }

    await chrome.storage.local.set({
      [Constants.SPONSOR_DOMAINS_STORAGE_KEY]: AdditionalSponsoredWebsites.concat(data['webshops'])
        .filter(obj => !!obj.orig_url)
        .reduce(function (map, obj) {
          var urlObj = parseURL(obj.orig_url);
          if (urlObj) map[urlObj.hostname.replace(/^www\./,'')] = obj;
          return map;
        }, {}),
    });
  }

  /**
   * Called when a user navigates to an sponsored domain
   * @param event {object}
   */
  onTabUpdated(tabId, changeInfo, tab) {
    chrome.storage.local.get([Constants.SPONSOR_DOMAINS_STORAGE_KEY, Constants.ALWAYS_REDIRECT_KEY]).then((storage) => {

      if (changeInfo["status"] && changeInfo["status"] == "loading") {
        const url = URL.parse(tab["url"]);

        // if url is valid
        if (url) {
          const hostname = url.hostname;
          const no_www_hostname = hostname.replace(/^\w+\./,'');
          const domains = storage[Constants.SPONSOR_DOMAINS_STORAGE_KEY];
          if (!domains) {
            this.updateUrls();
            return;
          }
          const target = domains[hostname] || domains[no_www_hostname];

          if (target) {
            // Check if we're still visiting the same site we already went through a sponsored link for
            if (this.sponsoredTabs[tabId] && this.sponsoredTabs[tabId]['hostname'] === hostname) {
              // If we have a origin location we came for, redirect back to that page
              if (this.sponsoredTabs[tabId]['referrer']) {
                this.navigateTo(tabId, this.sponsoredTabs[tabId]['referrer']);
                this.sponsoredTabs[tabId]['referrer'] = null;
                this.notifications.notifyOfRedirect(tabId);
              }
              return;
            }
            
            // We are not an affiliated domain but affiliation is not active yet
            if (storage[Constants.ALWAYS_REDIRECT_KEY]) {
                // Immediately redirect to the affiliated link
                this.sponsoredTabs[tabId] = { 'hostname': hostname, 'referrer': url.toString() };
                this.navigateTo(tabId, target['link']);
                return;
            } else {

                // Notify the user that there is an afiliation
                this.notifications.notifyOfAffiliation(this, tabId, target['name_short'], url, target['link']);
                return;
            }
          }
        };
      }
    });
  }

  /**
   * Change the current website on the specified tab
   * @param tabId {number} id of the tab to change the website of
   * @param target {string} new website url
   */
  navigateTo(tabId, target) {
    chrome.tabs.update(tabId, { url: target });
  }
}

/**
 * Parse a string url to an URL object
 * @param url {string} full url
 * @returns {string} url with the protocol, path and get parameters stripped
 */
function parseURL(url) {
  if (!url.match(/^(http|https)/i)) url = "https://" + url;
  return URL.parse(url);
}


/**
 * Return the unix timestamp of 1 day ago
 * @returns {number} unix timestamp in seconds
 */
function unixDayAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return unixTime(d);
}

/**
* Convert Date object to unix time in seconds
* @param date {Date} Date object
* @returns {number} unix time in seconds
*/
function unixTime(date) {
  return Math.round((date.getTime() / 1000));
}