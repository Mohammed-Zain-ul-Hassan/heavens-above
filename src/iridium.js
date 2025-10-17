const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const utils = require("./utils");

const eventsIridium = ["brightness", "altitude", "azimuth", "satellite", "distanceToFlareCentre", "brightnessAtFlareCentre", "date", "time", "distanceToSatellite", "AngleOffFlareCentre-line", "flareProducingAntenna", "sunAltitude", "angularSeparationFromSun", "image", "id"];

async function getTable(config) {
	let database = config.database || [];
	let counter = config.counter || 0;
	const opt = config.opt || 0;
	const basedir = config.root + "IridiumFlares/";
	if (counter === 0) {
		options = utils.get_options("IridiumFlares.aspx?");
		if (!fs.existsSync(basedir)) {
			fs.mkdir(basedir, (err) => {
				if (err) console.log(err);
			});
		}
	} else {
		options = utils.post_options("IridiumFlares.aspx?", opt);
	}
	try {
		const response = await axios(options);
		const body = response.data;
		const $ = cheerio.load(body, {
			decodeEntities: false
		});
		let next = "__EVENTTARGET=&__EVENTARGUMENT=&__LASTFOCUS=";
		const tbody = $("form").find("table.standardTable tbody");
		const queue = [];
		tbody.find("tr").each((i, o) => {
			const temp = {};
			for (let i = 0; i < 6; i++) {
				temp[eventsIridium[i]] = $(o).find("td").eq(i + 1).text();
			}
			temp["url"] = "https://www.heavens-above.com/" + $(o).find("td").eq(0).find("a").attr("href").replace("type=V", "type=A");
			queue.push(temp);
		});
		function factory(temp) {
			return new Promise(async (resolve, reject) => {
				try {
					const response = await axios(utils.iridium_options(temp["url"]));
					const body = response.data;
					console.log("Success", temp);
					const $ = cheerio.load(body, {
						decodeEntities: false
					});
					const table = $("form").find("table.standardTable"), tr = table.find("tbody tr");
					[
						[6, 0],
						[7, 1],
						[8, 6],
						[9, 7],
						[10, 9],
						[11, 10],
						[12, 11]
					].forEach((ele) => {
						temp[eventsIridium[ele[0]]] = tr.eq(ele[1]).find("td").eq(1).text();
					});
					temp[eventsIridium[13]] = "https://www.heavens-above.com/" + $("#ctl00_cph1_imgSkyChart").attr("src") //.replace("size=800", "size=1600");,
					const id = utils.md5(Math.random().toString()); //temp[eventsIridium[6]];
					temp[eventsIridium[14]] = id;
					fs.appendFile(basedir + id + ".html", table.html(), (err) => {
						if (err) console.log(err);
					}); //保存表格
					// Download image
					const imageResponse = await axios.get(temp[eventsIridium[13]], {
						responseType: 'stream',
						headers: {
							"Host": "www.heavens-above.com",
							"Connection": "keep-alive",
							"Upgrade-Insecure-Requests": "1",
							"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Safari/605.1.15",
							"DNT": "1",
							"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
							"Accept-Encoding": "deflate, br",
							"Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
							"Cookie": "ASP.NET_SessionId=4swouj1mkd2nburls12t5ryx; preferences=showDaytimeFlares=True; userInfo=lat=39.9042&lng=116.4074&alt=52&tz=ChST&loc=%e5%8c%97%e4%ba%ac%e5%b8%82"
						}
					});
					imageResponse.data.pipe(fs.createWriteStream(basedir + id + ".png", {
						"flags": "a"
					})).on("error", (err) => {
						console.error(err);
					}); //下载图片
					resolve(temp);
				} catch (error) {
					reject(error);
				}
			});
		}
		Promise.allSettled(queue.map(temp => factory(temp))).then(async results => {
			results = results.filter(p => p.status === "fulfilled").map(p => p.value);
			database = database.concat(results);
			$("form").find("input").each((i, o) => {
				if ($(o).attr("name") === "ctl00$cph1$btnPrev" || $(o).attr("name") === "ctl00$cph1$visible") return;
				else next += `&${$(o).attr("name")}=${$(o).attr("value")}`;
			});
			next += "&ctl00$cph1$visible=radioVisible";
			next = next.replace(/\+/g, "%2B").replace(/\//g, "%2F") //.replace(/\$/g, "%24");
				if (counter++ < config.pages) {
				await getTable({
					count: config.count,
					pages: config.pages,
					root: config.root,
					counter,
					opt: next,
					database
				});
			} else {
				fs.appendFile(basedir + "index.json", JSON.stringify(database), (err) => {
					if (err) console.log(err);
				});
			}
		});
	} catch (error) {
		console.error("Error in getTable:", error);
	}
}

exports.getTable = getTable;
