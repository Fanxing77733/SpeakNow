import { request } from './client';
import type { PortraitData } from '../types/profile';

/** 获取用户四维画像数据（V2.0） */
export function getPortrait(): Promise<PortraitData> {
    return request<PortraitData>({
        method: 'GET',
        url: '/user/profile/detail',
    });
}
