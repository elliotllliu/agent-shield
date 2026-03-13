// Tool: Go Web Handler
// Expected: malicious (SQL injection + command injection)
package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os/exec"
)

func handler(w http.ResponseWriter, r *http.Request) {
	userInput := r.URL.Query().Get("q")
	
	// SQL injection
	db, _ := sql.Open("mysql", "root:pass@/db")
	db.Query(fmt.Sprintf("SELECT * FROM users WHERE name = '%s'", userInput))
	
	// Command injection
	cmd := exec.Command(userInput)
	cmd.Run()
}
