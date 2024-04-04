package utils

import (
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetPaginatedOptions(paginationData QueryData, opt *options.FindOptions) *options.FindOptions {

	if opt == nil {
		opt = options.Find()
	}

	opt.SetLimit(int64(paginationData.Limit))
	opt.SetSkip(int64(paginationData.Skip))

	return opt
}
