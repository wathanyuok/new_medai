
import { Metadata } from 'next';
import React from 'react';
import UserInfoComponent from '../../../components/pages/UserInfo';

export const metadata: Metadata = {
  title: "User Information | EXA Med+",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
  // other metadata
};

const Page = () => {
  return (
    <div>
      <UserInfoComponent />
    </div>
  );
}

export default Page;


// import { Metadata } from 'next';
// import React from 'react';
// // import UserInfoComponent from '../../../components/pages/UserInfo';
// import Register from '@/components/pages/Register';

// export const metadata: Metadata = {
//   title: "User Information | EXA Med+",
//   description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
//   // other metadata
// };

// const Page = () => {
//   return (
//     <div>
//       {/* <UserInfoComponent /> */}
//       <Register />
//     </div>
//   );
// }

// export default Page;

