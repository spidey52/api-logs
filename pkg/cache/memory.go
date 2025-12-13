package cache

import (
	"bytes"
	"context"
	"encoding/gob"
	"fmt"
	"sync"
	"time"
)

type memoryItem struct {
	value  []byte // gob-encoded
	expiry time.Time
}

type MemoryCache struct {
	mu          sync.RWMutex
	items       map[string]memoryItem
	stopCleanup chan struct{}
}

func NewMemoryCache() *MemoryCache {
	mc := &MemoryCache{
		items:       make(map[string]memoryItem),
		stopCleanup: make(chan struct{}),
	}
	go mc.startCleanup(60 * time.Second) // cleanup every 60 seconds
	return mc
}

var _ Cache = (*MemoryCache)(nil)

// startCleanup runs a background goroutine to remove expired items periodically.
func (m *MemoryCache) startCleanup(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			m.removeExpired()
		case <-m.stopCleanup:
			return
		}
	}
}

// removeExpired deletes expired items from the cache.
func (m *MemoryCache) removeExpired() {
	now := time.Now().Unix()
	m.mu.Lock()
	for k, v := range m.items {
		if !v.expiry.IsZero() && now > v.expiry.Unix() {
			delete(m.items, k)
		}
	}
	m.mu.Unlock()
}

// Close stops the background cleanup goroutine. Call this if you want to clean up resources.
func (m *MemoryCache) Close() {
	close(m.stopCleanup)
}

func (m *MemoryCache) Set(ctx context.Context, key string, value any, duration time.Duration) error {
	expiry := time.Time{}
	if duration > 0 {
		expiry = time.Now().Add(duration)
	}
	var buf bytes.Buffer
	enc := gob.NewEncoder(&buf)
	if err := enc.Encode(value); err != nil {
		return fmt.Errorf("failed to encode value: %w", err)
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.items[key] = memoryItem{value: buf.Bytes(), expiry: expiry}
	return nil
}

func (m *MemoryCache) Get(ctx context.Context, key string, dest any) (bool, error) {
	m.mu.RLock()
	item, ok := m.items[key]
	m.mu.RUnlock()
	if !ok {
		return false, nil
	}

	if !item.expiry.IsZero() && time.Now().After(item.expiry) {
		m.mu.Lock()
		delete(m.items, key)
		m.mu.Unlock()
		return false, nil
	}

	buf := bytes.NewBuffer(item.value)
	dec := gob.NewDecoder(buf)
	if err := dec.Decode(dest); err != nil {
		return false, fmt.Errorf("failed to decode value: %w", err)
	}
	return true, nil
}

func (m *MemoryCache) Delete(ctx context.Context, key string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.items, key)
	return nil
}

// Incr implements Cache.
func (m *MemoryCache) Incr(ctx context.Context, key string) (int64, error) {
	return 0, fmt.Errorf("Incr not implemented")
}

// IncrBy implements Cache.
func (m *MemoryCache) IncrBy(ctx context.Context, key string, delta int64) (int64, error) {
	return 0, fmt.Errorf("IncrBy not implemented")
}
