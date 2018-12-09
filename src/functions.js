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

function checkUpdate() {
    getStorage(storage => {
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

async function updateURLs() {
    const response = await fetch(API);
    const data = await response.json();

    browser.storage.local.set({
        [URLS_KEY]: data['webshops'].reduce(function (map, obj) {
            map[extractHostname(obj.orig_url)] = obj;
            return map;
        }, [])
    });
}

function navigateTo(tabId, target) {
    browser.tabs.update(tabId, {url: target});
}

function enableLinking(link, target, tabId, hostname, notificationTitle) {
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

function handleCustomTarget(target, tabId, url, hostname) {
    // Check if we're still visiting the same site we already went through a sponsored link for
    if (hostname === sponsortabs[tabId]) {
        return;
    }

    enableLinking(
        target['link'],
        target,
        tabId,
        hostname,
        target['name_short'] + " heeft een C.S.V. Alpha affiliate link!"
    );
}

function navigationCompleteListener(event) {
    getStorage(storage => {
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
            return handleCustomTarget(custom_target, tabId, url, hostname);
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
            target,
            tabId,
            hostname,
            target['name_short'] + " heeft ook een gesponsorde link!"
        );
    });
}

function extractHostname(url) {
    //find & remove protocol (http, ftp, etc.) and get hostname, then find & remove "?"
    return ((url.indexOf("://") > -1) ? url.split('/')[2] : url.split('/')[0]).split('?')[0];
}

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
 */
function unixDayAgo() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return unixTime(d);
}

function unixTime(date) {
    return Math.round((date.getTime() / 1000));
}
