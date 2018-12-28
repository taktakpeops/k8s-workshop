package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

type ChuckQuote struct {
	IconURL string `json:"icon_url"`
	ID      string `json:"id"`
	URL     string `json:"url"`
	Value   string `json:"value"`
}

type SlackPayload struct {
	Text string `json:"text"`
}

func main() {
	slackWebhook := os.Getenv("SLACK_HOOK")

	fmt.Println("retrieve a Chuck Norris quote")

	// perform HTTP request
	resp, err := http.Get("https://api.chucknorris.io/jokes/random")

	if err != nil {
		panic("an error occured while retrieving quotes: " + err.Error())
	}

	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)

	if err != nil {
		panic("an error occured while reading the body: " + err.Error())
	}

	var quote ChuckQuote

	err = json.Unmarshal(body, &quote)

	if err != nil {
		panic("an error occured while unmarshaling the body: " + err.Error())
	}

	var slackBody SlackPayload

	slackBody.Text = quote.Value

	finalBody, err := json.Marshal(slackBody)

	if err != nil {
		panic("an error occured while marshaling the body for slack: " + err.Error())
	}

	r, err := http.Post(slackWebhook, "application/json", bytes.NewBuffer(finalBody))

	if err != nil {
		panic("an error occured wwhen publishing to Slack: " + err.Error())
	}

	fmt.Println("all good: " + r.Status)
}
