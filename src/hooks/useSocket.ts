import { useEffect } from 'react';
import { useSocketStore } from '@/store/socketStore';

export const useSocket = () => {
    const { socket, connect } = useSocketStore();

    useEffect(() => {
        connect();
    }, [connect]);

    return socket;
};
