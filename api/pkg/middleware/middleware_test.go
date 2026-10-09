package middleware

import (
	"reflect"
	"testing"
)

func TestSplitOrigins(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		raw  string
		want []string
	}{
		{
			name: "single origin",
			raw:  "https://app.example.com",
			want: []string{"https://app.example.com"},
		},
		{
			name: "comma separated list",
			raw:  "https://app.example.com,https://staging.example.com",
			want: []string{"https://app.example.com", "https://staging.example.com"},
		},
		{
			name: "whitespace around entries is trimmed",
			raw:  " https://app.example.com , https://staging.example.com ",
			want: []string{"https://app.example.com", "https://staging.example.com"},
		},
		{
			name: "empty entries are dropped",
			raw:  "https://app.example.com,,https://staging.example.com,",
			want: []string{"https://app.example.com", "https://staging.example.com"},
		},
		{
			name: "wildcard is passed through",
			raw:  "*",
			want: []string{"*"},
		},
		{
			name: "empty value falls back to the dev origin",
			raw:  "",
			want: []string{"http://localhost:3000"},
		},
		{
			name: "commas only falls back to the dev origin",
			raw:  " , , ",
			want: []string{"http://localhost:3000"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			if got := splitOrigins(tt.raw); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("splitOrigins(%q) = %#v, want %#v", tt.raw, got, tt.want)
			}
		})
	}
}
