const CLUBID = 4509;
const API = "https://www.sponsorkliks.com/api/?club="+CLUBID+"&call=webshops_club_extension";
const URLS_KEY = "urls";
const LASTCHECK_KEY = "lastcheck";
const NOTIFICATION_ID = "sponsor-notification-";
const UPDATE_CHECK_INTERVAL = 600;
const CUSTOM_TARGETS = {};
const CHROME = typeof browser === 'undefined';

if (CHROME) {
    browser = chrome;
}

/**
 * Check if we should update the websites with affiliate links from the API
 * Links are updated every 24 hours
 */
function checkUpdate() {
    getStorage([URLS_KEY, LASTCHECK_KEY], storage => {
        if (typeof storage[URLS_KEY] !== 'undefined') {
            const lastCheck = storage[LASTCHECK_KEY] || 0;
            if (lastCheck < unixDayAgo()) {
                browser.storage.local.set({
                    [LASTCHECK_KEY]: unixTime(new Date()),
                });
                updateURLs().catch(() => console.log("Failed to update urls"));
            }
        } else {
            updateURLs().catch(() => console.log("Failed to update urls"));
        }
    });
}

/**
 * Get all the websites with affiliate links from the API
 */
async function updateURLs() {
    const response = await fetch(API);
    const data = await response.json();

    browser.storage.local.set({
        [URLS_KEY]: data['webshops']
            .filter(obj => !!obj.orig_url)
            .reduce(function (map, obj) {
                map[extractHostname(obj.orig_url)] = obj;
                return map;
            }, {})
    });
}

/**
 * Change the current website on the specified tab
 * @param tabId {number} id of the tab to change the website of
 * @param target {string} new website url
 */
function navigateTo(tabId, target) {
    browser.tabs.update(tabId, {url: target});
}

/**
 * Show page action and notification for website which has an affiliate link
 * @param link {string} affiliate link
 * @param tabId {number} tab id of the website
 * @param hostname {string} hostname of the website
 * @param notificationTitle {string} title of the notification
 */
function enableLinking(link, tabId, hostname, notificationTitle) {
    // Page action
    browser.pageAction.show(tabId);
    browser.pageAction.onClicked.addListener(function () {
        sponsortabs[tabId] = hostname;
        browser.notifications.clear(NOTIFICATION_ID);
        navigateTo(tabId, link);
    });

    // Notification
    browser.notifications.create(NOTIFICATION_ID+tabId, {
        type: "basic",
        title: notificationTitle,
        message: "Klik op deze notificatie of de icoon van de extensie om via die link te gaan.",
        iconUrl: browser.extension.getURL("icons/icon128.png")
    }, function (nId) {
    });

    browser.notifications.onClicked.addListener(function (notificationId) {
        if (notificationId === NOTIFICATION_ID+tabId) {
            sponsortabs[tabId] = hostname;
            browser.notifications.clear(notificationId);
            navigateTo(tabId, link);
        }
    });
}

/**
 * Handle a website that has a custom affiliate link that was not received via the API
 * @param target {array} target information
 * @param tabId {number} tab id of the website
 * @param hostname {string} hostname of the website
 */
function handleCustomTarget(target, tabId, hostname) {
    // Check if we're still visiting the same site we already went through a sponsored link for
    if (hostname === sponsortabs[tabId]) {
        return;
    }

    enableLinking(
        target['link'],
        tabId,
        hostname,
        target['name_short'] + " heeft een C.S.V. Alpha affiliate link!"
    );
}

/**
 * Called when a user navigates to an url
 * @param event {object}
 */
function navigationCompleteListener(event) {
    getStorage(URLS_KEY, storage => {
        const tabId = event.tabId;
        const url = event.url;
        const hostname = extractHostname(url);
        const nowww_hostname = hostname.replace(/^(www\.)/,"");
        const custom_target = CUSTOM_TARGETS[hostname];

        // If there is no hostname found: return
        if (!hostname) {
            return;
        }

        // If we have a custom affiliate link for the current target
        if (custom_target) {
            return handleCustomTarget(custom_target, tabId, hostname);
        }

        const urls = storage[URLS_KEY];
        if (!urls) {
            // Apparently we were not able to retrieve the urls from the API yet
            return;
        }
        const target = (nowww_hostname !== hostname) ? urls[hostname] || urls[nowww_hostname] : urls[hostname] ;

        // If we're not on a sponsored link capable page: return
        if (!target) {
            return;
        }

        // Check if we're still visiting the same site we already went through a sponsored link for
        if (hostname === sponsortabs[tabId]) {
            return;
        }

        enableLinking(
            target["link"],
            tabId,
            hostname,
            target['name_short'] + " heeft ook een gesponsorde link!"
        );
    });
}

/**
 * Extract the hostname from a full url
 * Examples:
 * http://www.google.com/search?q=example => www.google.com
 * https://example.com?example => example.com
 * @param url {string} full url
 * @returns {string} url with the protocol, path and get parameters stripped
 */
function extractHostname(url) {
    return ((url.indexOf("://") > -1) ? url.split('/')[2] : url.split('/')[0]).split('?')[0];
}

/**
 * Get object(s) from local storage
 * If the second parameter is not set, the first parameter will be used as callback
 * and all objects will be retrieved instead of just the one specified by the key
 * @param key {string|string[]=} object(s) to get from storage
 * @param callback {function} function to call when the object(s) has/have loaded
 */
function getStorage(key, callback) {
    if (!callback || typeof callback !== 'function') {
        callback = key;
        key = false;
    }

    if (CHROME) {
        if (key) {
            browser.storage.local.get(key, callback);
        } else {
            browser.storage.local.get(callback);
        }
    } else {
        const promise = (key) ? browser.storage.local.get(key) : browser.storage.local.get();
        promise.then(callback);
    }
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
