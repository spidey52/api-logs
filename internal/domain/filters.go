package domain

import "time"

type SharedFilter struct {
	Limit  int
	Offset int
}

// LogFilter represents filtering criteria for querying logs
type LogFilter struct {
	SharedFilter
	ProjectID     string
	Environment   Environment
	Method        HTTPMethod
	StatusCode    *int
	StatusCodeMin *int
	StatusCodeMax *int
	Path          string
	Search        string
	FromDate      *time.Time
	ToDate        *time.Time
}

// ApplyDefaults sets default values for pagination
func (f *LogFilter) ApplyDefaults() {
	if f.Limit == 0 {
		f.Limit = 100
	}
	if f.Limit > 1000 {
		f.Limit = 1000 // max limit
	}
}

// ProjectFilter represents filtering criteria for querying projects
type ProjectFilter struct {
	SharedFilter
	Environment Environment
	IsActive    *bool
}

// ApplyDefaults sets default values for pagination
func (f *ProjectFilter) ApplyDefaults() {
	if f.Limit == 0 {
		f.Limit = 50
	}
	if f.Limit > 100 {
		f.Limit = 100
	}
}
