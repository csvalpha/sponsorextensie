import Constants from "../constants.js";

/**
 * Called when the DOM is loaded
 * Restores the saved settings
 */
function restoreOptions() {
    chrome.storage.local.get(Constants.ALWAYS_REDIRECT_KEY).then((storage) => {
        if (storage[Constants.ALWAYS_REDIRECT_KEY]) {
            document.getElementById('always-redirect').checked = true;
        }
    });
}

/**
 * Called when the form is submitted
 * @param e {object} submit event
 */
function saveOptions(e) {
    e.preventDefault();

    chrome.storage.local.set({
        [Constants.ALWAYS_REDIRECT_KEY]: document.getElementById('always-redirect').checked
    });

    const settingsSaved = document.getElementById('settings-saved');
    settingsSaved.innerHTML = 'Wijzigingen opgeslagen';
    setTimeout(function() {
        settingsSaved.innerText = '';
    }, 1000)
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('always-redirect').addEventListener('change', saveOptions);