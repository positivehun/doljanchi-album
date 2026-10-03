/**
 * 돌잔치 사진첩
 *
 * 사진 교체
 * 1. 각 월 폴더에 1.jpg ~ 5.jpg 를 넣습니다.
 *    예) ./images/202510/1.jpg ... ./images/202609/5.jpg
 * 2. 파일 이름이 1.jpg, 2.png 처럼 번호로 시작하면 그 번호 순서로 보여 줍니다.
 *    번호가 없으면 폴더 안 이미지를 이름 순으로 1번부터 채웁니다.
 * 3. 아래 PREFER_LOCAL_IMAGES 를 true 로 바꾸면 로컬 사진을 먼저 보여 줍니다.
 *    파일이 없으면 Unsplash 자리표시로 넘어갑니다.
 * 4. python3 server.py 로 열면 원본은 그대로 두고, 화면에는 긴 변 1800px JPEG을 보냅니다.
 *    페이지를 열면 로컬 사진을 모두 미리 받습니다.
 * 5. GitHub Pages에 올릴 때는 python3 build_pages.py 로 display/ 와 photos.json 을 만듭니다.
 *
 * 제목은 ALBUM 만 고치면 됩니다.
 */
const PREFER_LOCAL_IMAGES = true;

const ALBUM = {
  eyebrow: "",
  title: "은하의 돌잔치 앨범",
  subtitle: "2025.10 — 2026.09",
};

const PHOTOS_PER_MONTH = 5;
const START_YEAR = 2025;
const START_MONTH = 10;

const UNSPLASH_IDS = [
  "1515488042361-ee00e0ddd4e4",
  "1544126592-807ade215a0b",
  "1522771930-78848d9293e8",
  "1566004100631-35d015d6a491",
  "1491013516836-7db643ee125a",
  "1555252333-9f8e92e65df9",
  "1476703993599-0035a21b17a9",
  "1503454537195-1dcabb73ffb9",
  "1519689680058-324335c77eba",
  "1586105251261-72a756497a11",
  "1540479859555-17af45c78602",
  "1492725764893-90b379c2b6e7",
  "1516627145497-ae6968895b74",
  "1502086223501-7ea6ecd79368",
  "1519340241574-2cec6aef0c01",
  "1471286174890-9c112ffca5b4",
  "1511895426328-dc8714191300",
  "1609220136736-443140cffec6",
  "1531983412531-1f49a365ffed",
  "1478131143081-80f7f84ca84d",
  "1522771739844-6a9f6d5f14af",
  "1555255707-c07966088b7b",
  "1596461404969-9ae70f2830c1",
  "1464349095431-e9a21285b5f3",
  "1464347744102-11db6282f854",
  "1530103862676-de8c9debad1d",
  "1558636508-e0db3814bd1d",
  "1513151233558-d860c5398176",
  "1478144592103-25e218a04891",
  "1578985545062-69928b1d9587",
  "1486427944299-d1955d23e34d",
  "1414235077428-338989a2e8c0",
  "1504674900247-0877df9cc836",
  "1484723091739-30a097e8f929",
  "1490750967868-88aa4486c946",
  "1462275646964-a0e3386b89fa",
  "1507525428034-b723cf961d3e",
  "1470252649378-9c29740c9fa8",
  "1469474968028-56623f02e42e",
  "1500530855697-b586d89ba3ee",
  "1470071459604-3b5ec3a7fe05",
  "1441974231531-c6227db76b6e",
  "1475924156734-496f6cac6ec1",
  "1501785888041-af3ef285b470",
  "1433086966358-54859d0ed716",
  "1464822759023-fed622ff2c3b",
  "1511593358241-7eea1f3c84e5",
  "1506905925346-21bda4d32df4",
  "1470770841072-f978cf4d019e",
  "1519681393784-d120267933ba",
  "1506744038136-46273834b3fb",
  "1518173946687-a4c8892bbd9f",
  "1418065460487-3e41a6c84dc5",
  "1472214103451-9374bd1c798e",
  "1426604966848-d7adac402bff",
  "1447752875215-b2761acb3c5d",
  "1500534314209-a25ddb2bd429",
  "1452587925148-ce544e77e70d",
  "1493863641943-9b68992a8d07",
  "1529333166437-7750a6dd5a70",
];

const monthListEl = document.getElementById("month-list");
const wrapperEl = document.getElementById("swiper-wrapper");
const filmstripEl = document.getElementById("filmstrip");
const counterEl = document.getElementById("counter");
const progressEl = document.getElementById("progress-bar");
const preloadStatusEl = document.getElementById("preload-status");
const PRELOAD_AT_ONCE = 4;
const DECODE_BEHIND = 1;
const DECODE_AHEAD = 2;

function pad(value) {
  return String(value).padStart(2, "0");
}

function buildMonths() {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(START_YEAR, START_MONTH - 1 + index, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return {
      key: `${year}${pad(month)}`,
      label: `${year}년 ${month}월`,
      caption: `${year}.${pad(month)}`,
    };
  });
}

function buildSlides(months) {
  const slides = [];

  months.forEach((month, monthIndex) => {
    for (let number = 1; number <= PHOTOS_PER_MONTH; number += 1) {
      const flatIndex = monthIndex * PHOTOS_PER_MONTH + (number - 1);
      const photoId = UNSPLASH_IDS[flatIndex];

      slides.push({
        monthIndex,
        number,
        local: `./images/${month.key}/${number}.jpg`,
        fromFolder: false,
        placeholder: `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1800&q=75`,
        fallback: `https://picsum.photos/seed/dol-${month.key}-${number}/1800/1200`,
        alt: `${month.label} ${number}번째 사진`,
        caption: `${month.caption} (${number}/${PHOTOS_PER_MONTH})`,
      });
    }
  });

  return slides;
}

function markReady(img) {
  const ready = () => img.classList.add("is-ready");
  if (img.complete && img.naturalWidth > 0) ready();
  else img.addEventListener("load", ready, { once: true });
}

const IMAGE_NAME = /\.(jpe?g|png|webp|gif|heic|avif)$/i;

function assignFolderFiles(names) {
  const picked = Array(PHOTOS_PER_MONTH).fill(null);
  const used = new Set();

  names.forEach((name) => {
    const matched = name.match(/^(\d+)\.[^.]+$/);
    if (!matched) return;
    const number = Number(matched[1]);
    if (number < 1 || number > PHOTOS_PER_MONTH || picked[number - 1]) return;
    picked[number - 1] = name;
    used.add(name);
  });

  const rest = names.filter((name) => !used.has(name));
  let cursor = 0;
  for (let index = 0; index < picked.length; index += 1) {
    if (picked[index] || cursor >= rest.length) continue;
    picked[index] = rest[cursor];
    cursor += 1;
  }

  return picked;
}

async function listFolderImages(folder) {
  try {
    const response = await fetch(folder);
    if (!response.ok) return [];
    const html = await response.text();
    const names = [...html.matchAll(/href="([^"]+)"/g)]
      .map((match) => decodeURIComponent(match[1]))
      .filter((name) => IMAGE_NAME.test(name) && !name.includes("/"));
    names.sort((left, right) => left.localeCompare(right, "ko", { numeric: true }));
    return names;
  } catch (error) {
    return [];
  }
}

async function loadManifest() {
  try {
    const response = await fetch("./photos.json");
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function attachLocalImages(months, slides) {
  const manifest = await loadManifest();
  if (manifest) {
    months.forEach((month, monthIndex) => {
      const files = manifest[month.key] || [];
      files.slice(0, PHOTOS_PER_MONTH).forEach((file, index) => {
        const slide = slides[monthIndex * PHOTOS_PER_MONTH + index];
        slide.local = file;
        slide.fromFolder = true;
      });
    });
    return;
  }

  await Promise.all(
    months.map(async (month, monthIndex) => {
      const names = await listFolderImages(`./images/${month.key}/`);
      const files = assignFolderFiles(names);
      files.forEach((file, index) => {
        if (!file) return;
        const slide = slides[monthIndex * PHOTOS_PER_MONTH + index];
        slide.local = `./images/${month.key}/${encodeURIComponent(file)}`;
        slide.fromFolder = true;
      });
    })
  );
}

function setPhotoSource(img, slide) {
  const chain = [];
  if (PREFER_LOCAL_IMAGES && slide.local) chain.push(slide.local);
  chain.push(slide.placeholder, slide.fallback);
  let step = 0;

  img.referrerPolicy = "no-referrer";
  img.alt = slide.alt;
  img.decoding = "async";
  img.loading = slide.monthIndex === 0 && slide.number <= 2 ? "eager" : "lazy";

  img.addEventListener("error", () => {
    step += 1;
    if (step < chain.length) img.src = chain[step];
  });

  img.src = chain[0];
  markReady(img);
}

function renderMonths(months) {
  months.forEach((month, monthIndex) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "month-btn";
    button.dataset.month = String(monthIndex);
    button.innerHTML = `<span class="month-label">${month.label}</span><span class="month-pos"></span>`;
    item.appendChild(button);
    monthListEl.appendChild(item);
  });
}

function thumbSource(slide) {
  if (PREFER_LOCAL_IMAGES && slide.fromFolder && slide.local) return slide.local;
  return slide.placeholder;
}

function renderFilmstrip(slides) {
  slides.forEach((slide, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "thumb";
    button.dataset.index = String(index);
    button.dataset.month = String(slide.monthIndex);
    button.setAttribute("aria-label", slide.caption);

    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    const chain = [thumbSource(slide), slide.placeholder, slide.fallback];
    let step = 0;
    img.addEventListener("error", () => {
      step += 1;
      if (step < chain.length) img.src = chain[step];
    });
    img.src = chain[0];

    button.appendChild(img);
    filmstripEl.appendChild(button);
  });
}

function renderSlides(slides) {
  slides.forEach((slide) => {
    const el = document.createElement("div");
    el.className = "swiper-slide";
    el.innerHTML = `<figure class="frame"><img class="slide-photo" alt=""><figcaption class="slide-caption">${slide.caption}</figcaption></figure>`;
    setPhotoSource(el.querySelector("img"), slide);
    wrapperEl.appendChild(el);
  });
}

let activeMonth = -1;

function sync(index, slides) {
  const monthIndex = Math.floor(index / PHOTOS_PER_MONTH);
  const number = (index % PHOTOS_PER_MONTH) + 1;
  const buttons = monthListEl.querySelectorAll(".month-btn");
  const monthChanged = monthIndex !== activeMonth;
  activeMonth = monthIndex;

  buttons.forEach((button, buttonIndex) => {
    const active = buttonIndex === monthIndex;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
    button.querySelector(".month-pos").textContent = active ? `${number}/5` : "";
    if (active && monthChanged) {
      button.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  });

  counterEl.textContent = `${index + 1} / ${slides.length}`;
  progressEl.style.width = `${((index + 1) / slides.length) * 100}%`;
  warmNearbyPhotos(index);

  filmstripEl.querySelectorAll(".thumb").forEach((thumb) => {
    const inMonth = Number(thumb.dataset.month) === monthIndex;
    thumb.hidden = !inMonth;
    const active = Number(thumb.dataset.index) === index;
    thumb.classList.toggle("is-active", active);
    if (active) {
      thumb.setAttribute("aria-current", "true");
      const left = thumb.offsetLeft - (filmstripEl.clientWidth - thumb.offsetWidth) / 2;
      filmstripEl.scrollTo({ left, behavior: monthChanged ? "auto" : "smooth" });
    } else {
      thumb.removeAttribute("aria-current");
    }
  });
}

function warmNearbyPhotos(index) {
  const photos = wrapperEl.querySelectorAll(".slide-photo");
  photos.forEach((img, photoIndex) => {
    const near = photoIndex >= index - DECODE_BEHIND && photoIndex <= index + DECODE_AHEAD;
    if (!near || !img.getAttribute("src") || img.dataset.decodedSrc === img.src) return;
    img.dataset.decodedSrc = img.src;
    if (typeof img.decode === "function") img.decode().catch(() => {});
  });
}

function preloadLocalPhotos(slides) {
  const urls = [];
  const seen = new Set();
  slides.forEach((slide) => {
    if (!slide.fromFolder || !slide.local || seen.has(slide.local)) return;
    seen.add(slide.local);
    urls.push(slide.local);
  });
  if (!urls.length) return;

  preloadStatusEl.hidden = false;
  let done = 0;
  const queue = urls.slice();

  const updateStatus = () => {
    preloadStatusEl.textContent = `사진 받는 중 ${done}/${urls.length}`;
  };
  updateStatus();

  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        await fetch(url);
      } catch (error) {
        // 한 장이 실패해도 나머지 사진은 계속 받습니다.
      }
      done += 1;
      updateStatus();
    }
  };

  Promise.all(Array.from({ length: Math.min(PRELOAD_AT_ONCE, urls.length) }, worker)).then(() => {
    preloadStatusEl.hidden = true;
  });
}

async function init() {
  if (typeof Swiper === "undefined") {
    counterEl.textContent = "슬라이더를 불러오지 못했습니다. 네트워크를 확인해 주세요.";
    return;
  }

  document.getElementById("album-eyebrow").textContent = ALBUM.eyebrow;
  document.getElementById("album-title").textContent = ALBUM.title;
  document.getElementById("album-subtitle").textContent = ALBUM.subtitle;
  document.title = ALBUM.title;

  const months = buildMonths();
  const slides = buildSlides(months);
  if (PREFER_LOCAL_IMAGES) await attachLocalImages(months, slides);
  renderMonths(months);
  renderSlides(slides);
  renderFilmstrip(slides);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const swiper = new Swiper("#album-swiper", {
    speed: reduceMotion ? 0 : 520,
    slidesPerView: 1,
    spaceBetween: 0,
    resistanceRatio: 0.72,
    threshold: 8,
    grabCursor: true,
    observer: true,
    observeParents: true,
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    a11y: {
      prevSlideMessage: "이전 사진",
      nextSlideMessage: "다음 사진",
      firstSlideMessage: "첫 번째 사진입니다",
      lastSlideMessage: "마지막 사진입니다",
    },
    navigation: {
      prevEl: ".nav-prev",
      nextEl: ".nav-next",
    },
    on: {
      init(instance) {
        sync(instance.activeIndex, slides);
      },
      slideChange(instance) {
        sync(instance.activeIndex, slides);
      },
    },
  });

  monthListEl.addEventListener("click", (event) => {
    const button = event.target.closest(".month-btn");
    if (!button) return;
    swiper.slideTo(Number(button.dataset.month) * PHOTOS_PER_MONTH, 0);
  });

  filmstripEl.addEventListener("click", (event) => {
    const thumb = event.target.closest(".thumb");
    if (!thumb) return;
    swiper.slideTo(Number(thumb.dataset.index), 0);
  });

  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => swiper.update(), 280);
  });

  if (PREFER_LOCAL_IMAGES) preloadLocalPhotos(slides);
}

init();
