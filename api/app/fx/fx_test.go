package fx

import "testing"

func TestChangePct(t *testing.T) {
	if got := ChangePct(0, 10); got != nil {
		t.Errorf("from 0: got %v, want nil", *got)
	}
	if got := ChangePct(200, 250); got == nil || *got != 25 {
		t.Errorf("200 → 250: got %v, want 25", got)
	}
	// A negative base (net worth below 0) still reads as up when it improves.
	if got := ChangePct(-100, -50); got == nil || *got != 50 {
		t.Errorf("-100 → -50: got %v, want 50", got)
	}
}
