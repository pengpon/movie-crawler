const functions = require('@google-cloud/functions-framework');
const axios = require("axios");
const cheerio = require("cheerio");
const url = "https://meet.eslite.com/tw/tc/gallery/movieschedule/201803020001";

// 設定 Firebase 專案以及服務帳戶
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://wise-hub-273506-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getFirestore();

functions.http('getTimetable', async(req, res) => {
  try {

    let externalRes = await axios.get(url);
    let $ = cheerio.load(externalRes.data);
    let list = [];

    $(".film_list .box").each(function(i, elem) {
      // 電影名稱
      let name = $(this).find(".intro .left > p").text();
      // 電影介紹連結
      let link = `https://meet.eslite.com${$(this).find(".intro .right .btn-detail").attr("href")}`;
      // 電影縮圖連結
      let thumbUrl = `https://meet.eslite.com${$(this).find(".img img").attr("src")}`;
      // 電影縮圖文字
      let thumbAlt = $(this).find(".img img").attr("alt");
      // 電影資訊
      let infos = [];
      // 時刻表
      let timetable = [];

      // 取得電影資訊 (級別、片長...)
      $(this).find(".intro .right > ul > li").each(function (index, li) {
        let info = $(li).text();
        infos.push(info);
      });

      // 取得電影每日時刻
      $(this).find(".time-swiper .swiper-slide").each(function (j, slide) {
        let date = $(slide).find("p").text();
        let time = [] ;

        $(slide).find("ul li").each(function(k, text) {
          time.push($(text).text());
        })
        timetable.push({date, time});
      })

      list.push({name, link, thumbUrl, thumbAlt, infos, timetable});
    });

     // 增加 document 到 collection "movies"
    list.forEach(async(item) => {
      const res = await db.collection('movies').add({...item})
    })

    res.status(200).send(list);
  } catch (e) {
    console.log(e)
  }
})
