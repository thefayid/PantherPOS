import React from 'react';
import { TopBar } from '../components/TopBar';

const Tasks: React.FC = () => {
    console.log("Tasks Page DEBUG Mode Mounting");

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            <TopBar title="Task Management DEBUG" />
            <div className="flex-1 flex items-center justify-center p-6">
                <h1 className="text-2xl font-bold text-gray-800">Tasks Page Loaded Successfully</h1>
                <p className="text-gray-500 mt-2">Routing is working. The issue was in the main component.</p>
            </div>
        </div>
    );
};

export default Tasks;
