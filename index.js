'use strict'
const express = require('express')
const notifier = require('google-home-notifier')
const ngrok = require('ngrok')
const bodyParser = require('body-parser')
const YouTube = require('simple-youtube-api')
const GoogleSpreadsheet = require('google-spreadsheet')
const credentials = require('./credentials.json')
const config = require('./config.json')

const app = express()
const exec = require('child_process').exec
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const youtube = new YouTube(config.youtubeKey)
const logSheet = new GoogleSpreadsheet(config.sheetId)

const serverPort = 8091

var sheet
logSheet.useServiceAccountAuth(credentials, function (err) {
  logSheet.getInfo(function (err, data) {
    sheet = data.worksheets[0]
  })
})

app.post('/google-home-yt', bodyParser.json(), async function (req, res) {
  if (!req.body) return res.sendStatus(400)
  console.log(req.body)
  const text = req.body.text
  if (!text) return res.sendStatus(422)

  const playlists = await youtube.searchPlaylists(`${text} official`, 3, { part: 'id' })
  const playlist = playlists[0]
  console.log(playlist)
  const videos = await playlist.getVideos()
  const track = Math.floor(Math.random() * videos.length)
  console.log('Track: '+(track+1))
  console.log(videos[track])
  const vid = videos[track].id

  notifier.ip('192.168.11.10', 'ja')
  notifier.device('Google Home', 'ja')
  // notifier.device(config.googleHomeNotifier.deviceName, config.googleHomeNotifier.locale);
  // notifier.accent('ja')

  // notifier.notify("こんにちは、○○！ わたしは Google Home です。", (notifyRes) => {
  //   console.log(notifyRes)
  // })

  exec('youtube-dl -f bestaudio -g https://www.youtube.com/watch?v='+vid, (error, stdout, stderr) => {
    if (error !== null) {
      const message = 'exec error: '+error
      console.log(message)
      return res.send(message)
    }
    const soundUrl = stdout
    console.log(soundUrl)

    notifier.play(soundUrl, function (resN) {
      console.log(resN)
      return res.sendStatus(200)
    })
  })
})

app.post('/google-home-playlist', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)
  console.log(req.body)

  const playlistUrl = 'https://www.youtube.com/playlist?list=PL1WVPoc9631XEHtiNvBSst3REv88Rg6L_'
  notifier.ip('192.168.11.10', 'ja')
  notifier.device('Google Home', 'ja')
  const track = Math.floor(Math.random() * 37) + 1
  console.log('Track: '+track)

  exec(`youtube-dl -f bestaudio --playlist-items ${track} -g ${playlistUrl}`, (error, stdout, stderr) => {
    if (error !== null) {
      message = 'exec error: '+error
      console.log(message)
      return res.send(message)
    }
    const soundUrl = stdout
    console.log(soundUrl)

    notifier.play(soundUrl, function (resN) {
      console.log(resN)
      return res.sendStatus(200)
    })
  })
})

app.listen(serverPort, function () {
  ngrok.connect(serverPort, function (err, url) {
    console.log('Endpoints: ' + url + '/google-home-yt')
    console.log('POST example:')
    console.log(`curl -X POST -H "Content-type:application/json" -d '{"text": "Perfume"}' ${url}/google-home-yt`)
    // console.log('curl -X POST ' + url + '/google-home-playlist')
    sheet.getCells({
      'min-row': 1,
      'max-row': 1,
      'min-col': 1,
      'max-col': 1,
      'return-empty': true
    }, function (error, cells) {
      var cell = cells[0]
      cell.value = url + '/google-home-yt'
      cell.save()
      console.log('spread sheet update successful!!')
    })
  })
})
