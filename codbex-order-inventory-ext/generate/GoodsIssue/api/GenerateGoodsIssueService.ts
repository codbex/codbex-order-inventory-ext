import { SalesOrderRepository as SalesOrderDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderRepository";
import { SalesOrderItemRepository as SalesOrderItemDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderItemRepository";
import { CatalogueRepository as CatalogueDao } from "../../../../codbex-products/gen/codbex-products/dao/Catalogues/CatalogueRepository";
import { ProductRepository as ProductDao } from "../../../../codbex-products/gen/codbex-products/dao/Products/ProductRepository";
import { GoodsIssueRepository as GoodsIssueDao } from "../../../../codbex-inventory/gen/codbex-inventory/dao/GoodsIssues/GoodsIssueRepository";
import { GoodsIssueItemRepository as GoodsIssueItemDao } from "../../../../codbex-inventory/gen/codbex-inventory/dao/GoodsIssues/GoodsIssueItemRepository";

import { Controller, Get, Post, Put, Path, response } from "sdk/http";

@Controller
class GenerateGoodsIssueService {

    private readonly salesOrderDao;
    private readonly salesOrderItemDao;
    private readonly catalogueDao;
    private readonly productDao;
    private readonly goodsIssueDao;
    private readonly goodsIssueItemDao;

    constructor() {
        this.salesOrderDao = new SalesOrderDao();
        this.salesOrderItemDao = new SalesOrderItemDao();
        this.catalogueDao = new CatalogueDao();
        this.productDao = new ProductDao();
        this.goodsIssueDao = new GoodsIssueDao();
        this.goodsIssueItemDao = new GoodsIssueItemDao();
    }

    @Get("/salesOrderData/:salesOrderId")
    public salesOrderData(_: any, ctx: any) {
        const salesOrderId = ctx.pathParameters.salesOrderId;

        let salesOrder = this.salesOrderDao.findById(salesOrderId);

        return {
            "Date": salesOrder.Date,
            "Due": salesOrder.Due,
            "Customer": salesOrder.Customer,
            "Net": salesOrder.Net,
            "Currency": salesOrder.Currency,
            "Gross": salesOrder.Gross,
            "Discount": salesOrder.Discount,
            "Taxes": salesOrder.Taxes,
            "VAT": salesOrder.VAT,
            "Total": salesOrder.Total,
            "Conditions": salesOrder.Conditions,
            "PaymentMethod": salesOrder.PaymentMethod,
            "SentMethod": salesOrder.SentMethod,
            "Company": salesOrder.Company,
            "SalesOrderStatus": 1,
            "Operator": salesOrder.Operator,
            "Reference": salesOrder.UUID,
            "Store": salesOrder.Store
        };
    }

    @Get("/salesOrderItemsData/:salesOrderId")
    public salesOrderItemsData(_: any, ctx: any) {
        const salesOrderId = ctx.pathParameters.salesOrderId;

        let salesOrder = this.salesOrderDao.findById(salesOrderId);

        if (!salesOrder) {
            response.setStatus(response.BAD_REQUEST);
            ctx.body = {
                error: "Sales order not found"
            };
            return;
        }

        let salesOrderItems = this.salesOrderItemDao.findAll({
            $filter: {
                equals: {
                    SalesOrder: salesOrder.Id
                }
            }
        });

        let itemsForIssue = [];

        salesOrderItems.forEach(item => {
            if (item.SalesOrderItemStatus != 4) {
                itemsForIssue.push(item);
            }
        })

        return {
            ItemsForIssue: itemsForIssue
        }
    }

    @Get("/catalogueData")
    public catalogueRecordsData(_: any, ctx: any) {
        try {
            let catalogueRecords = this.catalogueDao.findAll();

            if (!catalogueRecords || catalogueRecords.length === 0) {
                return {
                    error: "No catalogue records found!"
                };
            }

            return {
                CatalogueRecords: catalogueRecords
            };
        } catch (error) {
            response.setStatus(response.BAD_REQUEST);
            return "An error occurred while fetching catalogue records!";
        }
    }

    @Get("/productData")
    public productsData(_: any, ctx: any) {
        try {
            let products = this.productDao.findAll();

            if (!products || products.length === 0) {
                return {
                    error: "No products found!"
                };
            }

            return {
                Products: products
            };
        } catch (error) {
            response.setStatus(response.BAD_REQUEST);
            return "An error occurred while fetching products!";
        }
    }

    @Post("/goodsIssue")
    addGoodsIssue(body: any, ctx: any) {
        try {
            ["Date", "Number", "Store", "Company", "Currency", "Net", "VAT", "Gross"].forEach(elem => {
                if (!body.hasOwnProperty(elem)) {
                    response.setStatus(response.BAD_REQUEST);
                    return;
                }
            })

            const newIssue = this.goodsIssueDao.create(body);

            if (!newIssue) {
                throw new Error("Failed to create GoodsIssue");
            }

            response.setStatus(response.CREATED);
            return newIssue;
        } catch (e) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
    }

    @Post("/goodsIssueItems")
    addGoodsIssueItems(body: any[], ctx: any) {
        try {
            const requiredFields = ["GoodsIssue", "Product", "Quantity", "UoM", "Price", "Net", "VAT", "Gross"];

            if (!Array.isArray(body)) {
                response.setStatus(response.BAD_REQUEST);
                return {
                    error: "Request body must be an array of items"
                };
            }

            for (const item of body) {
                for (const field of requiredFields) {
                    if (!item.hasOwnProperty(field)) {
                        response.setStatus(response.BAD_REQUEST);
                        return {
                            error: `Missing required field in item: ${field}`
                        };
                    }
                }
                const updatedItem = this.goodsIssueItemDao.create(item);

                if (!updatedItem) {
                    throw new Error("Failed to create GoodsIssueItem");
                }
            }

            response.setStatus(response.CREATED);
            return {
                message: "All items successfully created"
            };
        } catch (e) {
            response.setStatus(response.BAD_REQUEST);
            return {
                error: e.message
            };
        }
    }

    @Put("/salesOrderItems")
    updateSalesOrderItems(body: any[], ctx: any) {
        try {
            const requiredFields = [
                "Id",
                "SalesOrder",
                "Product",
                "Quantity",
                "UoM",
                "Price",
                "NET",
                "VAT",
                "Gross",
                "SalesOrderItemStatus",
                "Availability"
            ];

            if (!Array.isArray(body)) {
                response.setStatus(response.BAD_REQUEST);
                return {
                    error: "Request body must be an array of items"
                };
            }

            for (const item of body) {
                for (const field of requiredFields) {
                    if (!item.hasOwnProperty(field)) {
                        response.setStatus(response.BAD_REQUEST);
                        return {
                            error: `Missing required field in item: ${field}`
                        };
                    }
                }

                this.salesOrderItemDao.update(item);

            }

            response.setStatus(response.OK);
            return {
                message: "All items successfully updated"
            };
        } catch (e) {
            response.setStatus(response.BAD_REQUEST);
            return {
                error: e.message
            };
        }
    }

    @Post("/salesOrderItems")
    addSalesOrderItem(body: any, ctx: any) {
        try {
            ["SalesOrder", "Product", "Quantity", "UoM", "Price", "NET", "VAT", "Gross", "SalesOrderItemStatus"].forEach(elem => {
                if (!body.hasOwnProperty(elem)) {
                    response.setStatus(response.BAD_REQUEST);
                    return;
                }
            })

            const newSalesOrderItems = this.salesOrderItemDao.create(body);

            if (!newSalesOrderItems) {
                throw new Error("Failed to create GoodsIssue");
            }

            response.setStatus(response.CREATED);
            return newSalesOrderItems;
        } catch (e) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
    }

}