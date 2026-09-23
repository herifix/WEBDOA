window.addEventListener("message", (event) => {
  // Hanya terima message dari page yang sama
  if (event.source !== window) {
    return;
  }

  const data = event.data;

  if (!data || data.type !== "OPEN_WHATSAPP_WEB") {
    return;
  }

  const phone = String(data.phone || "").trim();
  const message = String(data.message || "");

  if (!phone) {
    console.error("[WA Extension] Nomor WhatsApp kosong.");
    return;
  }

window.postMessage(
  {
    type: "WA_WEB_EXTENSION_READY"
  },
  window.location.origin
);

  chrome.runtime.sendMessage(
    {
      type: "OPEN_WHATSAPP_WEB",
      phone,
      message
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "[WA Extension] Runtime error:",
          chrome.runtime.lastError.message
        );
        return;
      }

      console.log("[WA Extension] Response:", response);
    }
  );
});