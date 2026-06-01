import { useEffect, useState } from "react";

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  const iosNavigator = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(iosNavigator.standalone);
}

export default function InstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isIOSDevice() && !isStandalone());
  }, []);

  if (!visible) return null;

  return (
    <div className="install-hint">
      Untuk memasang aplikasi: buka Share lalu pilih Add to Home Screen.
    </div>
  );
}
