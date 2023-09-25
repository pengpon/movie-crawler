const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const url = "https://meet.eslite.com/tw/tc/gallery/movieschedule/201803020001";

(async() => {
  try {
    let res = await axios.get(url);
    let $ = cheerio.load(res.data);
    let list = [];

    $(".film_list .box").each(function(i, elem) {
      // 電影名稱, 介紹連結, 縮圖, 縮圖說明
      let name = $(this).find(".intro .left > p").text(),
          link = `https://meet.eslite.com${$(this).find(".intro .right .btn-detail").attr("href")}`,
          thumbUrl = `https://meet.eslite.com${$(this).find(".img img").attr("src")}`,
          thumbAlt = $(this).find(".img img").attr("alt");

      let infos = [],
          timetable = [];

      // 電影資訊 (級別, 片長, 字幕)
      $(this).find(".intro .right > ul > li").each(function (index, li) {
        let info = $(li).text();
        infos.push(info);
      });

      // 放映場次
      $(this).find(".time-swiper .swiper-slide").each(function (j, slide) {
        let date = $(slide).find("p").text();
        let time = [] ;
        $(slide).find("ul li").each(function(k, text) {
          time.push($(text).text());
        })
        timetable.push({date, time})
      });

      list.push({name, link, thumbUrl, thumbAlt, infos, timetable})
    });

    fs.writeFileSync("build/film-timetable.json", JSON.stringify(list));
  } catch (err) {
    console.log(err);
  }
})()
