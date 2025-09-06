import { SetMetadata } from '@nestjs/common';

export const AllowAnonymous = () => SetMetadata('allowAnonymous', true);
