// ==UserScript==
// @name         Pinterest - Open & Close Image(s)
// @namespace    http://tampermonkey.net/
// @version      0.5.1
// @description  Shift+Z: 后台打开鼠标悬停图片的 URL；Shift+C: 打开当前页面所有图片 URL（后台打开）；Shift+X: 关闭所有 URL 以 https://i.pinimg.com/originals 开头的标签页
// @author       YourName
// @include      https://*.pinterest.tld/*
// @grant        GM_openInTab
// @noframes
// @license      MIT
// @compatible   firefox Firefox
// @compatible   chrome Chrome
// ==/UserScript==

(function() {
  'use strict';

  // 用于存储所有通过脚本打开且 URL 以 https://i.pinimg.com/originals 开头的标签页引用
  const openedOriginalTabs = [];
  const ORIGINAL_PREFIX = "https://i.pinimg.com/originals";

  // 根据鼠标悬停区域查找第一个图片元素，返回其 src 属性
  function getHoveredImageUrl() {
    const hoveredElements = document.querySelectorAll(':hover');
    for (let i = hoveredElements.length - 1; i >= 0; i--) {
      const img = hoveredElements[i].querySelector('img');
      if (img && img.src) {
        return img.src;
      }
    }
    return null;
  }

  // 打开一个指定的 URL，若 URL 以 ORIGINAL_PREFIX 开头，则保存其标签引用
  function openUrl(url, active) {
    const tab = GM_openInTab(url, { active: active });
    if (url.startsWith(ORIGINAL_PREFIX)) {
      openedOriginalTabs.push(tab);
    }
  }

  // 打开鼠标悬停图片的 URL（Shift+Z，后台打开）
  function openHoveredImage() {
    const imageUrl = getHoveredImageUrl();
    if (imageUrl) {
      openUrl(imageUrl, false); // false 表示后台打开
    } else {
      console.warn("未找到悬停图片的 URL");
    }
  }

  // 获取页面上所有图片的 URL（去重）
  function getAllImageUrls() {
    const imgElements = document.querySelectorAll('img');
    const urls = new Set();
    imgElements.forEach(img => {
      if (img.src) {
        urls.add(img.src);
      }
    });
    return Array.from(urls);
  }

  // 打开当前页面所有图片的 URL（Shift+C，后台打开）
  function openAllImages() {
    const urls = getAllImageUrls();
    if (urls.length === 0) {
      console.warn("当前页面未找到图片 URL");
      return;
    }
    urls.forEach(url => {
      openUrl(url, false);
    });
  }

  // 关闭所有 URL 以 ORIGINAL_PREFIX 开头的标签页（Shift+X）
  function closeOriginalTabs() {
    if (openedOriginalTabs.length === 0) {
      console.warn("没有找到需要关闭的标签页");
      return;
    }
    openedOriginalTabs.forEach(tab => {
      try {
        tab.close();
      } catch (e) {
        console.error("无法关闭标签页：", e);
      }
    });
    // 清空数组
    openedOriginalTabs.length = 0;
  }

  window.addEventListener("keydown", function(event) {
    // 只处理同时按下 Shift 键的情况
    if (!event.shiftKey) return;

    // 排除输入框等场景
    if (event.defaultPrevented ||
        /(input|textarea)/i.test(document.activeElement.nodeName) ||
        document.activeElement.matches('[role="textbox"], [role="textarea"]')) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'z':
        openHoveredImage();
        event.preventDefault();
        break;
      case 'c':
        openAllImages();
        event.preventDefault();
        break;
      case 'x':
        closeOriginalTabs();
        event.preventDefault();
        break;
      default:
        break;
    }
  }, true);
})();
