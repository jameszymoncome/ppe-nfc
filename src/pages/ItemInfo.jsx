import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { FileText, QrCode } from 'lucide-react';

const ItemInfo = () => {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-800">Assets Info</h1>
                        <p className="text-gray-600">Scan & Inspect items with assigned NFC tags</p>
                    </div>
                </div>

                
            </div>
        </div>
    );
}
export default ItemInfo;