const API = "https://csrdelft.nl/API/2.0/sponsorkliks";
const API_TIMESTAMP = API + "/timestamp";
const URLS_KEY = "urls";
const URLFILTERS_KEY = "urlfilters";
const LASTCHECK_KEY = "lastcheck";
const TIMESTAMP_KEY = "timestamp";
const NOTIFICATION_ID = "sponsorkliks-notification";
const UPDATE_CHECK_INTERVAL = 600;

if (typeof browser === 'undefined') {
    browser = chrome;
}

function checkUpdate() {
    if (typeof store.get(URLS_KEY) !== 'undefined') {
        var lastCheck = store.get(LASTCHECK_KEY) || 0;
        if (lastCheck < unixDayAgo()) {
            var lastTimestamp = store.get(TIMESTAMP_KEY) || 0;
            $.get(API_TIMESTAMP, function (timestamp) {
                if (lastTimestamp < parseInt(timestamp)) {
                    store.set(LASTCHECK_KEY, unixTime(new Date()));
                    store.set(TIMESTAMP_KEY, timestamp);
                    updateURLs()
                }
            });
        }
    } else {
        updateURLs();
    }
}

function updateURLs() {
    $.getJSON(API, function (urls) {
        var hostFilters = $.map(urls, function (value, index) {
            return {hostContains: index};
        });

        if (browser.webNavigation.onCompleted.hasListener(navigationCompleteListener)) {
            browser.webNavigation.onCompleted.removeListener(navigationCompleteListener);
        }
        browser.webNavigation.onCompleted.addListener(navigationCompleteListener, {url: hostFilters});

        store.set(URLS_KEY, urls);
        store.set(URLFILTERS_KEY, hostFilters);
    });
}

function navigateTo(target) {
    browser.tabs.update({url: "https://sponsorkliks.com" + target});
}

function findTarget(currentUrl) {
    var urls = store.get(URLS_KEY);
    return urls[extractHostname(currentUrl)].link;
}

function navigationCompleteListener(event) {
    var tabId = event.tabId;
    var url = event.url;
    // Check if we're still visiting the same site we already went through sponsorkliks for
    if (extractHostname(url) === sponsorkliks[tabId]) {
        return;
    }

    // Page action
    browser.pageAction.show(tabId);
    browser.pageAction.onClicked.addListener(function () {
        sponsorkliks[tabId] = extractHostname(url);
        browser.notifications.clear(NOTIFICATION_ID);
        navigateTo(findTarget(url), tabId);
    });

    // Notification
    browser.notifications.create("sponsorkliks-notification", {
        type: "basic",
        title: "Deze website heeft ook een sponsorkliks link!",
        message: "Klik op deze notificatie of de icoon van de extensie om sponsorkliks te gebruiken.",
        iconUrl: "/icons/icon128.png"
    }, function (nId) {
        notificationId = nId;
    });
    browser.notifications.onClicked.addListener(function (notificationId) {
        if (notificationId === NOTIFICATION_ID) {
            sponsorkliks[tabId] = extractHostname(url);
            browser.notifications.clear(notificationId);
            navigateTo(findTarget(url), tabId);
        }
    });
}

function extractHostname(url) {
    //find & remove protocol (http, ftp, etc.) and get hostname, then find & remove "?"
    return ((url.indexOf("://") > -1) ? url.split('/')[2] : url.split('/')[0]).split('?')[0];
}

/**
 * Return the unix timestamp of 1 day ago
 */
function unixDayAgo() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return unixTime(d);
}

function unixTime(date) {
    return Math.round((date.getTime() / 1000));
}
