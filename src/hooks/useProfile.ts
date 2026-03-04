  import { Customer } from '@/types/customer';
import { useState } from 'react';
  

  export const useProfile = () => {
    const [userDataProfile, setUserDataProfile] = useState<Customer | null>(null);
  
    return { userDataProfile, setUserDataProfile };
  };