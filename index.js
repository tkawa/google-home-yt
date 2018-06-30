'use strict'
const express = require('express')
const notifier = require('google-home-notifier')
const ngrok = require('ngrok')
const bodyParser = require('body-parser')
const app = express()
const exec = require('child_process').exec
const urlencodedParser = bodyParser.urlencoded({ extended: false })

const serverPort = 8091

app.post('/google-home-yt', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)
  console.log(req.body)

  const vid = req.body.v // 'wUpItG7dOGU', 'K54CYowOqxM', etc...
  if (!vid) return res.sendStatus(422)

  notifier.ip('192.168.11.10', 'ja')
  notifier.device('Google Home', 'ja')
  // notifier.device(config.googleHomeNotifier.deviceName, config.googleHomeNotifier.locale);
  // notifier.accent('ja')

  // notifier.notify("こんにちは、○○！ わたしは Google Home です。", (notifyRes) => {
  //   console.log(notifyRes)
  // })

  exec('youtube-dl -f bestaudio -g https://www.youtube.com/watch?v='+vid, (error, stdout, stderr) => {
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
    console.log('curl -X POST -d "v=wUpItG7dOGU" ' + url + '/google-home-yt')
    console.log('curl -X POST ' + url + '/google-home-playlist')
  })
})
