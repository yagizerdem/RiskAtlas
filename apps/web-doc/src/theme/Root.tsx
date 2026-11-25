import React, {type ReactNode} from 'react';
import {TooltipProvider} from '@/components/ui/tooltip';
import {Toaster} from '@/components/ui/toast';

export default function Root({children}: {children: ReactNode}) {
  return (
    <TooltipProvider>
      <Toaster>{children}</Toaster>
    </TooltipProvider>
  );
}
