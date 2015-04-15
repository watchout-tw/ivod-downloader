var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var cheerio = require("cheerio");
var async = require('async');
var path = require("path");
var fs = require("fs");
var mpegts_to_mp4 = require('mpegts_to_mp4');
var PORT = process.env.PORT || 8080;

var app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.get('/' ,function (req, res) {
  res.sendFile(path.resolve(__dirname + '/index.html'));
});

app.get('/download', function(req, res){ return res.redirect('/');});

app.post('/download', function (req, response) {
  var link = req.body.link;
  if(!link.match(/^http:\/\/ivod.ly.gov.tw/)) {
    return response.format({
      'text/html': function() {
        return response.send('<p>網址不正確，範例: http://ivod.ly.gov.tw/Play/VOD/81330/300K </p><a href="/">回下載頁</a>');
      }
    });
  } else {
    request(link, function(err, res, body) {
      if(err) {
        return response.format({
          'text/html': function() {
            return response.send('<p>' + err.message + '</p><a href="/">回下載頁</a>');
          }
        });
      } else {
        response.setHeader('Content-Type', 'application/octet-stream');
        var $ = cheerio.load(body);
        var committee = $('.video-text h4').text().replace('主辦單位 ：','');
        var title = $('.video-text h4').next().text();
        var legislator = $('.video-text h4').next().next().text().replace('委員名稱：','');
        var duration = $('.video-text h4').next().next().next().text().replace('委員發言時間：','');
        var filename = (committee + title + legislator + duration).replace(' ', '-') + ".mp4";
        response.attachment(filename);
        $('script').each(function(i, e) {
          var content = $(e).text().trim();
          if(content.match(/readyPlayer/)) {
            var movie = JSON.parse(content.split('\n')[1].trim().replace('var _movie = ','').replace(';',''));
            var url = movie.FILNAM.replace('f4m','m3u8');
            request(url, function(err, res, body){
              var uri = res.req.path.replace('manifest.m3u8','');
              var playlist = 'http://h264media02.ly.gov.tw:1935' + uri + body.split('\n').filter(function(it) {
                if(it.match(/m3u8$/)) return it;
              }).join('');
              request(playlist, function(err, res, body) {
                var segments = body.split('\n').filter(function(it) {
                  if(it.match(/ts$/)) return true;
                }).map(function (it) {
                  return 'http://h264media02.ly.gov.tw:1935' + uri + it;
                });
                var ts = fs.createWriteStream('output.ts');
                async.eachSeries(segments, function(segment, callback) {
                  var req = request(segment);
                  var filename = req.path.split('/')[5];
                  console.log(filename);
                  req.on('data', function(it) {
                    ts.write(it);
                  });
                  req.on('end', function() {
                    callback() });
                  req.on('error', function(err){
                    console.log(err);
                  });

                }, function () {
                  ts.end();
                  console.log('downloaded');
                  mpegts_to_mp4("output.ts", "output.mp4", function () {
                    var readStream = fs.createReadStream("output.mp4");
                    readStream.pipe(response);
                    fs.unlink("output.ts");
                    fs.unlink("output.mp4");
                  });
                });
              });
            });
          }
        });
      }
    }); // end of first request
  }
});

app.listen(PORT, function() {
  console.log('server listen on', PORT);
});
