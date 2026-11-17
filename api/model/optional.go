package model

import (
	"bytes"
	"encoding/json"
)

// Optional is a PATCH field that can tell three cases apart, which a plain
// pointer cannot:
//
//	key left out   → Set == false            (don't change it)
//	"key": null    → Set == true, Value nil  (clear it)
//	"key": value   → Set == true, Value set  (change it)
type Optional[T any] struct {
	Set   bool
	Value *T
}

// UnmarshalJSON runs only when the key is present, including for null.
func (o *Optional[T]) UnmarshalJSON(b []byte) error {
	o.Set = true
	if bytes.Equal(bytes.TrimSpace(b), []byte("null")) {
		o.Value = nil
		return nil
	}
	var v T
	if err := json.Unmarshal(b, &v); err != nil {
		return err
	}
	o.Value = &v
	return nil
}

// MarshalJSON writes the value, or null when it is cleared or not set.
func (o Optional[T]) MarshalJSON() ([]byte, error) {
	return json.Marshal(o.Value)
}
