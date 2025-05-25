import { Controller, Get, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('')
  listProducts(@Query('q') q?: string) {
    return this.catalogService.listProducts(q);
  }
}
