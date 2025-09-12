"use client";

import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import React, { useEffect, useState, useContext } from 'react';
import { UserDetailContext } from './context/UserDetailContext';

function Provider({ children }: any) {
    const { user } = useUser();
    const createUser = useMutation(api.users.CreateNewUser);
    const [UserDetail, setUserDetail] = useState<any>();

    useEffect(() => {
        if (user) {
            CreateNewUser();
        }
        // eslint-disable-next-line
    }, [user]);

    const CreateNewUser = async () => {
        if (user) {
            const result = await createUser({
                email: user?.primaryEmailAddress?.emailAddress ?? '',
                imageUrl: user?.imageUrl,
                name: user?.fullName ?? '',
            });
            setUserDetail(result);
        }
    };

    return (
        <UserDetailContext.Provider value={{ UserDetail, setUserDetail }}>
            <div>{children}</div>
        </UserDetailContext.Provider>
    );
}

export default Provider;

// Corrected custom hook
export const useUserDetailContext = () => useContext(UserDetailContext);