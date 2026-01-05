package cache

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client
var ctx = context.Background()

func Connect(redisURL string) error {
	Client = redis.NewClient(&redis.Options{
		Addr:     redisURL,
		Password: "",
		DB:       0,
	})

	_, err := Client.Ping(ctx).Result()
	if err != nil {
		log.Printf("⚠️ Redis ga ulanmadi (ixtiyoriy): %v", err)
		Client = nil
		return nil // Redis ixtiyoriy
	}

	log.Println("✅ Redis ga ulandi")
	return nil
}

func Set(key string, value interface{}, ttl time.Duration) error {
	if Client == nil {
		return nil
	}

	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return Client.Set(ctx, key, data, ttl).Err()
}

func Get(key string, dest interface{}) error {
	if Client == nil {
		return redis.Nil
	}

	data, err := Client.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}

	return json.Unmarshal(data, dest)
}

func Delete(key string) error {
	if Client == nil {
		return nil
	}
	return Client.Del(ctx, key).Err()
}

func DeletePattern(pattern string) error {
	if Client == nil {
		return nil
	}

	keys, err := Client.Keys(ctx, pattern).Result()
	if err != nil {
		return err
	}

	if len(keys) > 0 {
		return Client.Del(ctx, keys...).Err()
	}
	return nil
}

func Close() {
	if Client != nil {
		Client.Close()
		log.Println("✅ Redis ulanish yopildi")
	}
}
