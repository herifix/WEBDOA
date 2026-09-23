async function findWhatsAppTab() {
  const tabs = await chrome.tabs.query({
    url: "https://web.whatsapp.com/*"
  });

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return tabs[0];
}

function buildWhatsAppUrl(phone, message) {
  const normalizedPhone = String(phone || "").replace(/\D/g, "");

  const url = new URL("https://web.whatsapp.com/send");

  url.searchParams.set("phone", normalizedPhone);
  url.searchParams.set("text", message || "");

  return url.toString();
}

async function openOrReuseWhatsApp(phone, message) {
  const url = buildWhatsAppUrl(phone, message);

  const existingTab = await findWhatsAppTab();

  if (existingTab?.id) {
    await chrome.tabs.update(existingTab.id, {
      url,
      active: true
    });

    if (existingTab.windowId) {
      await chrome.windows.update(existingTab.windowId, {
        focused: true
      });
    }

    return {
      success: true,
      action: "updated",
      tabId: existingTab.id
    };
  }

  const newTab = await chrome.tabs.create({
    url,
    active: true
  });

  return {
    success: true,
    action: "created",
    tabId: newTab.id
  };
}

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request?.type !== "OPEN_WHATSAPP_WEB") {
      return;
    }

    openOrReuseWhatsApp(
      request.phone,
      request.message
    )
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        console.error("[WA Extension]", error);

        sendResponse({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : String(error)
        });
      });

    return true;
  }
);