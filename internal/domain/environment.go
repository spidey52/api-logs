package domain

import "errors"

// Environment represents the deployment environment
type Environment string

const (
	EnvironmentDev        Environment = "dev"
	EnvironmentProduction Environment = "production"
)

// String returns the string representation of the environment
func (e Environment) String() string {
	return string(e)
}

// Validate validates the environment value
func (e Environment) Validate() error {
	switch e {
	case EnvironmentDev, EnvironmentProduction:
		return nil
	default:
		return errors.New("invalid environment: must be 'dev' or 'production'")
	}
}

// IsValid checks if the environment is valid
func (e Environment) IsValid() bool {
	return e.Validate() == nil
}
