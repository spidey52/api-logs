package postgres

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/spidey52/api-logs/internal/domain"
	"github.com/spidey52/api-logs/internal/ports/output"
)

type APILogRepository struct {
	pool *pgxpool.Pool
}

// CountByProject implements output.APILogRepository.
func (r *APILogRepository) CountByProject(ctx context.Context, projectID string, environment domain.Environment) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM api_logs WHERE project_id = $1 AND environment = $2`, projectID, string(environment)).Scan(&count)
	return count, err
}

// Create implements output.APILogRepository.
func (r *APILogRepository) Create(ctx context.Context, log *domain.APILog) error {
	paramsJSON, _ := json.Marshal(log.Params)
	queryParamsJSON, _ := json.Marshal(log.QueryParams)

	_, err := r.pool.Exec(ctx, `
		INSERT INTO api_logs (
			id, project_id, environment, method, path, params, query_params, status_code,
			response_time, content_length, ip_address, user_agent, error_message, user_id, timestamp
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)
	`,
		log.ID, log.ProjectID, string(log.Environment), string(log.Method), log.Path, paramsJSON, queryParamsJSON, log.StatusCode,
		log.ResponseTime, log.ContentLength, log.IPAddress, log.UserAgent, log.ErrorMessage, log.UserID, log.Timestamp,
	)
	return err
}

// Delete implements output.APILogRepository.
func (r *APILogRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM api_logs WHERE id = $1`, id)
	return err
}

// FindByID implements output.APILogRepository.
func (r *APILogRepository) FindByID(ctx context.Context, id string) (*domain.APILog, error) {
	query := `
		SELECT id, project_id, environment, method, path, params, query_params, status_code,
			   response_time, content_length, ip_address, user_agent, error_message, user_id, timestamp
		FROM api_logs WHERE id = $1`
	var log domain.APILog
	var paramsJSON, queryParamsJSON []byte
	var envStr, methodStr string
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&log.ID, &log.ProjectID, &envStr, &methodStr, &log.Path, &paramsJSON, &queryParamsJSON, &log.StatusCode,
		&log.ResponseTime, &log.ContentLength, &log.IPAddress, &log.UserAgent, &log.ErrorMessage, &log.UserID, &log.Timestamp,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrLogNotFound
		}
		return nil, err
	}
	log.Environment = domain.Environment(envStr)
	log.Method = domain.HTTPMethod(methodStr)
	json.Unmarshal(paramsJSON, &log.Params)
	json.Unmarshal(queryParamsJSON, &log.QueryParams)
	return &log, nil
}

// GetAverageResponseTime implements output.APILogRepository.
func (r *APILogRepository) GetAverageResponseTime(ctx context.Context, projectID string, environment domain.Environment) (float64, error) {
	var avg float64
	err := r.pool.QueryRow(ctx, `SELECT AVG(response_time) FROM api_logs WHERE project_id = $1 AND environment = $2`, projectID, string(environment)).Scan(&avg)
	if err != nil {
		return 0, err
	}
	return avg, nil
}

// GetMethodDistribution implements output.APILogRepository.
func (r *APILogRepository) GetMethodDistribution(ctx context.Context, projectID string, environment domain.Environment) (map[string]int64, error) {
	rows, err := r.pool.Query(ctx, `SELECT method, COUNT(*) FROM api_logs WHERE project_id = $1 AND environment = $2 GROUP BY method`, projectID, string(environment))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	dist := make(map[string]int64)
	for rows.Next() {
		var method string
		var count int64
		if err := rows.Scan(&method, &count); err != nil {
			return nil, err
		}
		dist[method] = count
	}
	return dist, nil
}

// GetStatusCodeDistribution implements output.APILogRepository.
func (r *APILogRepository) GetStatusCodeDistribution(ctx context.Context, projectID string, environment domain.Environment) (map[int]int64, error) {
	rows, err := r.pool.Query(ctx, `SELECT status_code, COUNT(*) FROM api_logs WHERE project_id = $1 AND environment = $2 GROUP BY status_code`, projectID, string(environment))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	dist := make(map[int]int64)
	for rows.Next() {
		var status int
		var count int64
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		dist[status] = count
	}
	return dist, nil
}

// GetTimeSeriesStats implements output.APILogRepository.
func (r *APILogRepository) GetTimeSeriesStats(ctx context.Context, projectID string, environment domain.Environment) ([]map[string]interface{}, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT time_bucket('1 hour', timestamp) AS bucket, COUNT(*) AS count
		FROM api_logs
		WHERE project_id = $1 AND environment = $2 AND timestamp >= NOW() - INTERVAL '24 hours'
		GROUP BY bucket ORDER BY bucket DESC`, projectID, string(environment))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []map[string]interface{}
	for rows.Next() {
		var bucket time.Time
		var count int64
		if err := rows.Scan(&bucket, &count); err != nil {
			return nil, err
		}
		stats = append(stats, map[string]interface{}{
			"timestamp": bucket,
			"count":     count,
		})
	}
	return stats, nil
}

// GetTopEndpoints implements output.APILogRepository.
func (r *APILogRepository) GetTopEndpoints(ctx context.Context, projectID string, environment domain.Environment, limit int) ([]map[string]interface{}, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT path, COUNT(*) AS count
		FROM api_logs
		WHERE project_id = $1 AND environment = $2
		GROUP BY path ORDER BY count DESC LIMIT $3`, projectID, string(environment), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var endpoints []map[string]interface{}
	for rows.Next() {
		var path string
		var count int64
		if err := rows.Scan(&path, &count); err != nil {
			return nil, err
		}
		endpoints = append(endpoints, map[string]interface{}{
			"path":  path,
			"count": count,
		})
	}
	return endpoints, nil
}

// GetUniquePaths implements output.APILogRepository.
func (r *APILogRepository) GetUniquePaths(ctx context.Context, projectID string, environment domain.Environment) ([]string, error) {
	rows, err := r.pool.Query(ctx, `SELECT DISTINCT path FROM api_logs WHERE project_id = $1 AND environment = $2 ORDER BY path`, projectID, string(environment))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var paths []string
	for rows.Next() {
		var path string
		if err := rows.Scan(&path); err != nil {
			return nil, err
		}
		paths = append(paths, path)
	}
	return paths, nil
}

var _ output.APILogRepository = (*APILogRepository)(nil)

func NewAPILogRepository(pool *pgxpool.Pool) *APILogRepository {
	return &APILogRepository{pool: pool}
}

func (r *APILogRepository) CreateLog(ctx context.Context, log *domain.APILog) error {
	paramsJSON, _ := json.Marshal(log.Params)
	queryParamsJSON, _ := json.Marshal(log.QueryParams)

	_, err := r.pool.Exec(ctx, `
        INSERT INTO api_logs (
            id, project_id, environment, method, path, params, query_params, status_code,
            response_time, content_length, ip_address, user_agent, error_message, user_id, timestamp
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
    `,
		log.ID, log.ProjectID, string(log.Environment), string(log.Method), log.Path, paramsJSON, queryParamsJSON, log.StatusCode,
		log.ResponseTime, log.ContentLength, log.IPAddress, log.UserAgent, log.ErrorMessage, log.UserID, log.Timestamp,
	)
	return err
}

func (r *APILogRepository) FindByFilter(ctx context.Context, filter domain.LogFilter) ([]*domain.APILog, error) {
	baseQuery := `
		SELECT id, project_id, environment, method, path, params, query_params, status_code,
			   response_time, content_length, ip_address, user_agent, error_message, user_id, timestamp
		FROM api_logs
		WHERE project_id = $1 AND environment = $2`

	args := []interface{}{filter.ProjectID, string(filter.Environment)}
	conditions := []string{"project_id = $1", "environment = $2"}
	argIndex := 2

	if filter.Method != "" {
		argIndex++
		conditions = append(conditions, "method = $"+strconv.Itoa(argIndex))
		args = append(args, string(filter.Method))
	}
	if filter.StatusCode != nil {
		argIndex++
		conditions = append(conditions, "status_code = $"+strconv.Itoa(argIndex))
		args = append(args, *filter.StatusCode)
	}
	if filter.StatusCodeMin != nil {
		argIndex++
		conditions = append(conditions, "status_code >= $"+strconv.Itoa(argIndex))
		args = append(args, *filter.StatusCodeMin)
	}
	if filter.StatusCodeMax != nil {
		argIndex++
		conditions = append(conditions, "status_code <= $"+strconv.Itoa(argIndex))
		args = append(args, *filter.StatusCodeMax)
	}
	if filter.Path != "" {
		argIndex++
		conditions = append(conditions, "path LIKE $"+strconv.Itoa(argIndex))
		args = append(args, "%"+filter.Path+"%")
	}
	if filter.Search != "" {
		argIndex++
		conditions = append(conditions, "(path ILIKE $"+strconv.Itoa(argIndex)+" OR error_message ILIKE $"+strconv.Itoa(argIndex)+")")
		args = append(args, "%"+filter.Search+"%")
	}
	if filter.FromDate != nil {
		argIndex++
		conditions = append(conditions, "timestamp >= $"+strconv.Itoa(argIndex))
		args = append(args, *filter.FromDate)
	}
	if filter.ToDate != nil {
		argIndex++
		conditions = append(conditions, "timestamp <= $"+strconv.Itoa(argIndex))
		args = append(args, *filter.ToDate)
	}

	query := baseQuery
	if len(conditions) > 2 {
		query += " AND " + strings.Join(conditions[2:], " AND ")
	}
	query += " ORDER BY timestamp DESC LIMIT $" + strconv.Itoa(argIndex+1) + " OFFSET $" + strconv.Itoa(argIndex+2)
	args = append(args, filter.Limit, filter.Offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*domain.APILog
	for rows.Next() {
		var log domain.APILog
		var paramsJSON, queryParamsJSON []byte
		var envStr string
		var methodStr string
		err := rows.Scan(
			&log.ID, &log.ProjectID, &envStr, &methodStr, &log.Path, &paramsJSON, &queryParamsJSON, &log.StatusCode,
			&log.ResponseTime, &log.ContentLength, &log.IPAddress, &log.UserAgent, &log.ErrorMessage, &log.UserID, &log.Timestamp,
		)
		if err != nil {
			return nil, err
		}
		log.Environment = domain.Environment(envStr)
		log.Method = domain.HTTPMethod(methodStr)
		json.Unmarshal(paramsJSON, &log.Params)
		json.Unmarshal(queryParamsJSON, &log.QueryParams)
		logs = append(logs, &log)
	}
	return logs, nil
}

func (r *APILogRepository) CountByFilter(ctx context.Context, filter domain.LogFilter) (int64, error) {
	baseQuery := `SELECT COUNT(*) FROM api_logs WHERE project_id = $1 AND environment = $2`
	args := []interface{}{filter.ProjectID, string(filter.Environment)}
	conditions := []string{"project_id = $1", "environment = $2"}
	argIndex := 2

	if filter.Method != "" {
		argIndex++
		conditions = append(conditions, "method = $"+strconv.Itoa(argIndex))
		args = append(args, string(filter.Method))
	}
	if filter.StatusCode != nil {
		argIndex++
		conditions = append(conditions, "status_code = $"+strconv.Itoa(argIndex))
		args = append(args, *filter.StatusCode)
	}
	if filter.StatusCodeMin != nil {
		argIndex++
		conditions = append(conditions, "status_code >= $"+strconv.Itoa(argIndex))
		args = append(args, *filter.StatusCodeMin)
	}
	if filter.StatusCodeMax != nil {
		argIndex++
		conditions = append(conditions, "status_code <= $"+strconv.Itoa(argIndex))
		args = append(args, *filter.StatusCodeMax)
	}
	if filter.Path != "" {
		argIndex++
		conditions = append(conditions, "path LIKE $"+strconv.Itoa(argIndex))
		args = append(args, "%"+filter.Path+"%")
	}
	if filter.Search != "" {
		argIndex++
		conditions = append(conditions, "(path ILIKE $"+strconv.Itoa(argIndex)+" OR error_message ILIKE $"+strconv.Itoa(argIndex)+")")
		args = append(args, "%"+filter.Search+"%")
	}
	if filter.FromDate != nil {
		argIndex++
		conditions = append(conditions, "timestamp >= $"+strconv.Itoa(argIndex))
		args = append(args, *filter.FromDate)
	}
	if filter.ToDate != nil {
		argIndex++
		conditions = append(conditions, "timestamp <= $"+strconv.Itoa(argIndex))
		args = append(args, *filter.ToDate)
	}

	query := baseQuery
	if len(conditions) > 2 {
		query += " AND " + strings.Join(conditions[2:], " AND ")
	}

	var count int64
	err := r.pool.QueryRow(ctx, query, args...).Scan(&count)
	return count, err
}
