# C.S.R. Sponsor Extensie

## Installatie
### Chrome
#### Develop
1. Kloon deze repository
2. Ga naar [chrome://extensions](chrome://extensions) 
3. Klik op de knop "Load unpacked"
4. Selecteer de gekloonde folder

#### Live
De Chrome extensie kan vanuit de Chrome Webstore geïnstalleerd worden: [https://chrome.google.com/webstore/detail/csv-alpha-sponsor-extensi/anlcblpmlnecbomgkbmfngcpbaciipml](https://chrome.google.com/webstore/detail/csv-alpha-sponsor-extensi/anlcblpmlnecbomgkbmfngcpbaciipml)

### Firefox
#### Develop
1. Kloon deze repository
2. Ga naar [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
3. Klik op de knop "Load Temporary Add-on"
4. Selecteer het `manifest.json` bestand in de gekloonde folder

#### Live
De Firefox extensie kan vanuit de Add-on Store geïnstalleerd worden:
[https://addons.mozilla.org/en-US/firefox/addon/c-s-r-sponsor/](https://addons.mozilla.org/en-US/firefox/addon/c-s-r-sponsor/)

## Updaten van de plugin
### Chrome
1. Log in op [het Chrome Webstore Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Selecteer de extensie
3. Klik op "Package" in het menu
4. Maak een zipje van de broncode (de `.git` map, `.gitignore` en `README.md` kan je hier buiten laten)
5. Klik op de knop "Upload new package" en selecteer het zipje
6. Klik op de knop "Publish item"

### Firefox
1. Log in op [het Firefox Add-on Developer Hub](https://addons.mozilla.org/en-GB/developers/)
2. Selecteer de extensie
3. Klik op "Upload New Version"
4. Maak een zipje van de broncode (de `.git` map, `.gitignore` en `README.md` kan je hier buiten laten)
5. Selecteer het zipje en volg de stappen