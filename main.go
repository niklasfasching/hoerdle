package main

import (
	"embed"
	"encoding/json"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
)

//go:embed assets/*
var assets embed.FS

func main() {
	if len(os.Args) >= 2 && os.Args[1] == "tracks" {
		// reddits top 100 earworms
		if err := run("5YFtKCsIIxyzCMZiZ29JDj"); err != nil {
			log.Fatal(err)
		}
		return
	}
	log.Fatal(serve())
}

func serve() error {
	fs, err := fs.Sub(assets, "assets")
	if err != nil {
		return err
	}
	http.Handle("/", http.FileServer(http.FS(fs)))
	return http.ListenAndServe("localhost:9000", nil)
}

func run(id string) error {
	bs, err := os.ReadFile("config.json")
	if err != nil {
		return err
	}
	c := struct{ SpotifyToken string }{}
	if err := json.Unmarshal(bs, &c); err != nil {
		return err
	}
	m, err := GetPlaylist(id, c.SpotifyToken)
	if err != nil {
		return err
	}
	bs, err = json.MarshalIndent(m, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile("assets/tracks.json", bs, 0644)
}

func GetPlaylist(id, token string) (map[string]string, error) {
	req, err := http.NewRequest("GET", "https://api.spotify.com/v1/playlists/"+id, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	bs, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}
	v := struct {
		Tracks struct {
			Items []struct {
				Track struct {
					Name       string
					PreviewURL string `json:"preview_url"`
					Artists    []struct {
						Name string
					}
				}
			}
		}
	}{}
	if err := json.Unmarshal(bs, &v); err != nil {
		return nil, err
	}
	m := map[string]string{}
	for _, x := range v.Tracks.Items {
		if x.Track.PreviewURL == "" {
			continue
		}
		name := x.Track.Artists[0].Name
		if len(x.Track.Artists) > 1 {
			name += " (et al)"
		}
		name += " - " + x.Track.Name
		m[name] = x.Track.PreviewURL
	}
	return m, nil
}
