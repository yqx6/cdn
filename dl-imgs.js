// 图片打包工具 - 修复版
(function () {
  // 默认配置
  const DEFAULT_CONFIG = {
    selector: ".grid-scroll--O0kCz img",
    outputName: "images.zip",
    verbose: true,
  };

  const CONFIG = window.__ZIP_CONFIG__
    ? Object.assign({}, DEFAULT_CONFIG, window.__ZIP_CONFIG__)
    : DEFAULT_CONFIG;

  console.log("当前配置(可通过window.__ZIP_CONFIG__修改)", CONFIG);

  const log = (...args) => CONFIG.verbose && console.log(...args);
  const error = (...args) => console.error(...args);

  async function loadJSZip() {
    if (typeof window.JSZip !== "undefined") {
      return window.JSZip;
    }

    log("正在加载 JSZip 库...");
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.onload = () => {
        if (typeof window.JSZip !== "undefined") {
          resolve(window.JSZip);
        } else {
          reject(new Error("JSZip 加载失败"));
        }
      };
      script.onerror = () => reject(new Error("JSZip 脚本加载失败"));
      document.head.appendChild(script);
    });
  }

  async function packImages() {
    try {
      // 先加载 JSZip
      const JSZip = await loadJSZip();
      const zip = new JSZip();

      const images = document.querySelectorAll(CONFIG.selector);

      if (images.length === 0) {
        error(`未找到图片，选择器: ${CONFIG.selector}`);
        return;
      }

      log(`找到 ${images.length} 张图片，开始打包...`);

      let successCount = 0;

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        let src = img.src || img.getAttribute("data-src");

        if (src && src.startsWith("http")) {
          try {
            const response = await fetch(src);
            const blob = await response.blob();

            let ext = ".jpg";
            if (blob.type.includes("png")) ext = ".png";
            if (blob.type.includes("gif")) ext = ".gif";
            if (blob.type.includes("webp")) ext = ".webp";

            zip.file(`${String(i + 1).padStart(3, "0")}${ext}`, blob);
            successCount++;
            log(`✓ 已添加 [${successCount}/${images.length}]`);
          } catch (err) {
            error(`✗ 添加失败 [${i + 1}]:`, err);
          }
        }
      }

      if (successCount === 0) {
        error("没有成功打包任何图片");
        return;
      }

      log("正在生成 ZIP 文件...");
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = CONFIG.outputName;
      link.click();
      URL.revokeObjectURL(link.href);

      log(`完成！成功打包 ${successCount}/${images.length} 张图片`);
    } catch (err) {
      error("打包失败:", err.message);
    }
  }

  packImages();
})();
