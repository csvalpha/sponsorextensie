const CLUBID = 4509;
const API = 'https://www.sponsorkliks.com/api/?club='+CLUBID+'&call=webshops_club_extension';
const URLS_KEY = 'urls';
const LASTCHECK_KEY = 'lastcheck';
const ALWAYS_REDIRECT_KEY = 'always-redirect';
const NOTIFICATION_ID = 'sponsor-notification-';
const UPDATE_CHECK_INTERVAL = 600;
const CUSTOM_TARGETS = {
    'ah.nl': {
        'category': 'Eten & Drinken',
        'name_short': 'Albert Heijn',
        'link': 'https://www.sponsorkliks.com/link.php?club=4509&shop_id=2670&shop=Albert+Heijn&link=aHR0cCUzQSUyRiUyRnByZi5obiUyRmNsaWNrJTJGY2FtcmVmJTNBMTEwMGx3eWQlMkZwdWJyZWYlM0FTS180'
    },
    'coolblue.nl': {
        'category': 'Computers & Electronica',
        'name_short': 'Coolblue',
        'link': 'https://www.sponsorkliks.com/link.php?club=4509&shop_id=61&shop=Coolblue&link=aHR0cCUzQSUyRiUyRnByZi5obiUyRmNsaWNrJTJGY2FtcmVmJTNBMTAxMWwzNDc3JTJGcHVicmVmJTNBU0tfNCUyRmFkcmVmJTNBU0tfNA=='
    },
    'www.disneylandparis.com': {
        'category': 'Reizen & Vakantie',
        'name_short': 'Disneyland Parijs',
        'link': 'https://www.sponsorkliks.com/link.php?club=4509&shop_id=2283&shop=Disneyland+Parijs&link=aHR0cHMlM0ElMkYlMkZjbGsudHJhZGVkb3VibGVyLmNvbSUyRmNsaWNrJTNGcCUzRDE5NzE2JTI2YSUzRDIwNDA5ODMlMjZnJTNENjc2MzEzJTI2RVBJJTNEU0tfNA=='
    },
    'klm.com': {
        'category': 'Reizen & Vakantie',
        'name_short': 'KLM',
        'link': 'https://www.sponsorkliks.com/link.php?club=4509&shop_id=2148&shop=KLM&link=aHR0cCUzQSUyRiUyRnByZi5obiUyRmNsaWNrJTJGY2FtcmVmJTNBMTBsSEY5JTJGcHVicmVmJTNBU0tfNA=='
    },
    'mediamarkt.nl': {
        'category': 'Computers & Electronica',
        'name_short': 'MediaMarkt',
        'link': 'https://www.sponsorkliks.com/link.php?club=4509&shop_id=2158&shop=MediaMarkt&link=aHR0cHMlM0ElMkYlMkZjbGsudHJhZGVkb3VibGVyLmNvbSUyRmNsaWNrJTNGcCUzRDI2MjMzNiUyNmElM0QyMDQwOTgzJTI2ZyUzRDIyNjI3MzkwJTI2RVBJJTNEU0tfNA=='
    },
    'thuisbezorgd.nl': {
        'category': 'Eten & Drinken',
        'name_short': 'Thuisbezorgd.nl',
        'link': 'https://www.sponsorkliks.com/link.php?club=4509&shop_id=4&shop=Thuisbezorgd.nl&link=aHR0cCUzQSUyRiUyRnd3dy5hd2luMS5jb20lMkZhd2NsaWNrLnBocCUzRmdpZCUzRDM0MjkwMSUyNm1pZCUzRDEwNTEwJTI2YXdpbmFmZmlkJTNEMzI4ODQxJTI2bGlua2lkJTNEMjIxMTM1MSUyNmNsaWNrcmVmJTNEU0tfNA=='
    }
};
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
                updateURLs().catch(() => console.log('Failed to update urls'));
            }
        } else {
            updateURLs().catch(() => console.log('Failed to update urls'));
        }
    });
}

/**
 * Get all the websites with affiliate links from the API
 */
async function updateURLs() {
    const response = await fetch(API);
    const data = await response.json();

    // Add custom targets that are not present in the API
    for (var url in CUSTOM_TARGETS) {
        var custom_data = CUSTOM_TARGETS[url];
        custom_data['orig_url'] = url;
        data['webshops'].push(custom_data)
    }

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
 * @param referer {string} url of the website to redirect to after redirect from sponsorkliks.nl
 * @param notificationTitle {string} title of the notification
 */
function enableLinking(link, tabId, hostname, referer, notificationTitle) {
    // Page action
    browser.pageAction.show(tabId);
    browser.pageAction.onClicked.addListener(function () {
        sponsortabs[tabId] = {'hostname': hostname, 'referer': referer};
        browser.notifications.clear(NOTIFICATION_ID);
        navigateTo(tabId, link);
    });

    // Notification
    browser.notifications.create(NOTIFICATION_ID+tabId, {
        type: 'basic',
        title: notificationTitle,
        message: 'Klik op deze notificatie of de icoon van de extensie om via die link te gaan.',
        iconUrl: browser.extension.getURL('icons/icon128.png')
    }, function (nId) {
    });

    browser.notifications.onClicked.addListener(function (notificationId) {
        if (notificationId === NOTIFICATION_ID+tabId) {
            sponsortabs[tabId] = {'hostname': hostname, 'referer': referer};
            browser.notifications.clear(notificationId);
            navigateTo(tabId, link);
        }
    });
}

/**
 * Called when a user navigates to an url
 * @param event {object}
 */
function navigationCompleteListener(event) {
    getStorage([URLS_KEY, ALWAYS_REDIRECT_KEY], storage => {
        const tabId = event.tabId;
        const url = event.url;
        const hostname = extractHostname(url);
        const nowww_hostname = hostname.replace(/^(www\.)/,'');
        const custom_target = CUSTOM_TARGETS[nowww_hostname];

        // If there is no hostname found: return
        if (!hostname) {
            return;
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
        if (sponsortabs[tabId] && hostname === sponsortabs[tabId]['hostname']) {
            // If we have a origin location we came for, redirect back to that page
            if(sponsortabs[tabId]['referer']){
                navigateTo(tabId, sponsortabs[tabId]['referer']);
                sponsortabs[tabId]['referer'] = null;
            }
            return;
        }

        if (storage[ALWAYS_REDIRECT_KEY]) {
            // Immediately redirect to the affiliated link
            sponsortabs[tabId] = {'hostname': hostname, 'referer': url};
            navigateTo(tabId, target['link']);
        } else {
            enableLinking(
                target['link'],
                tabId,
                hostname,
                url,
                target['name_short'] + ' heeft ook een gesponsorde link!'
            );
        }
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
    return ((url.indexOf('://') > -1) ? url.split('/')[2] : url.split('/')[0]).split('?')[0];
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
