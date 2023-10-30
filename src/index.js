const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const url = "https://meet.eslite.com/tw/tc/gallery/movieschedule/201803020001";
const { slackUrl }= require('./config.js');
const movieResultTemplate = require("./slack-movie-card");

(async() => {
  try {
    const notifyBlockSlack = async (payload) => {
      await axios.post(slackUrl, payload);
    }

    let res = await axios.get(url);
    let $ = cheerio.load(res.data);
    let list = [];

  $(".film_list .box").each(function(i, elem) {
    let name = $(this).find(".intro .left > p").text();
    let link = `https://meet.eslite.com${$(this).find(".intro .right .btn-detail").attr("href")}`;
    let thumbUrl = `https://meet.eslite.com${$(this).find(".img img").attr("src")}`;
    let thumbAlt = $(this).find(".img img").attr("alt");
    let infos = [];

    $(this).find(".intro .right > ul > li").each(function (index, li) {
      let info = $(li).text();
      infos.push(info);
    })
    let timetable = [];
    $(this).find(".time-swiper .swiper-slide").each(function (j, slide) {
      let date = $(slide).find("p").text();
      let time = [] ;
      $(slide).find("ul li").each(function(k, text) {
        time.push($(text).text());
      })
      timetable.push({date, time})
    })

    list.push({name, link, thumbUrl, thumbAlt, infos, timetable})
  });

  // 電影時刻另存檔案
  // fs.writeFileSync("eslite-film-timetable.json", JSON.stringify(list));

  // 製作 Slack 訊息格式
  let movieResult = {...movieResultTemplate.result};
  let cardResult = [];
  let today = `${new Date().getMonth() + 1}/${new Date().getDate()}`;
  list.forEach((item) => {
    const regex = /\d+\/\d+/;
    let movieDate = item.timetable[0].date.match(regex)[0]
    if (movieDate !== today) return;

    let time = item.timetable[0].time.join(' | ');
    let card = JSON.parse(JSON.stringify(movieResultTemplate.card));
    let infos = item.infos.join('\n');
    card[0].text.text = `*<${item.link}|${item.name}>*\n${infos}\n時刻： ${time}`;
    card[0].accessory.image_url = item.thumbUrl;
    card[0].accessory.alt_text = item.thumbAlt;
    cardResult.push(...card);
  })
  movieResult.blocks[0].text.text = `${today} 今日放映 :movie_camera:`
  movieResult.blocks.push(...cardResult);

  notifyBlockSlack((movieResult));
  // fs.writeFileSync("eslite-film-result.json", JSON.stringify(movieResult));
  } catch (err) {
    console.log(err)
  }
})()