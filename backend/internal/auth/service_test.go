package auth

import "testing"

func TestTokenIsRandomAndStoredAsHash(t *testing.T) {
	tokenA, hashA, err := newToken()
	if err != nil {
		t.Fatal(err)
	}
	tokenB, hashB, err := newToken()
	if err != nil {
		t.Fatal(err)
	}
	if tokenA == tokenB || hashA == hashB {
		t.Fatal("tokens must be unique")
	}
	if tokenA == hashA || hashToken(tokenA) != hashA {
		t.Fatal("database value must be a deterministic token hash")
	}
}
