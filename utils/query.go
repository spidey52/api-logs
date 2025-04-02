package utils

import (
	"fmt"
	"regexp"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type QueryData struct {
	Limit     uint64
	Skip      uint64
	Search    string
	StartDate time.Time
	EndDate   time.Time
}

func ParseDate(date string) (time.Time, error) {
	layouts := []string{
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
		"2006-01-02",
	}

	for _, layout := range layouts {
		t, err := time.ParseInLocation(layout, date, time.Local)
		if err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date: %s", date)

}

func GetQueryData(c *gin.Context) QueryData {
	var queryData = QueryData{
		Limit:  10,
		Skip:   0,
		Search: "",
	}

	var err error
	limit := c.Query("limit")
	page := c.Query("page")

	if limit != "" {
		queryData.Limit, err = strconv.ParseUint(limit, 10, 64)
		if err != nil {
			fmt.Println("Error in parsing limit, ", err.Error())
		}
	}

	if page != "" {
		page, err := strconv.ParseUint(page, 10, 64)
		if err != nil {
			fmt.Println("Error in parsing page, ", err.Error())
			page = 0
		}
		queryData.Skip = (page) * queryData.Limit
	}

	if c.Query("search") != "" {
		search := c.Query("search")

		// sanitize the search string
		search = regexp.QuoteMeta(search)

		// assign the sanitized search string
		queryData.Search = search
	}

	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	if startDate != "" {
		queryData.StartDate, err = ParseDate(startDate)

		if err != nil {
			fmt.Println("Error in parsing start date")
		}

	}

	if endDate != "" {
		// queryData.EndDate, err = time.Parse("2006-01-02", endDate)
		queryData.EndDate, err = ParseDate(endDate)

		if err != nil {
			fmt.Println("Error in parsing end date")
		}

		if queryData.EndDate.Hour() == 0 && queryData.EndDate.Minute() == 0 && queryData.EndDate.Second() == 0 {

			queryData.EndDate = queryData.EndDate.Add(time.Hour * 23)
			queryData.EndDate = queryData.EndDate.Add(time.Minute * 59)
			queryData.EndDate = queryData.EndDate.Add(time.Second * 59)
			queryData.EndDate = queryData.EndDate.Add(time.Millisecond * 999)

		}

		fmt.Println(queryData.EndDate)
		fmt.Println(queryData.StartDate)

	}

	return queryData
}

func GetSearchFilter(search string) bson.M {
	if search == "" {
		return nil
	}

	return bson.M{"$text": bson.M{"$search": search}}
}
