import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const chartData = [
  { month: 'Jan', balance: 32000 },
  { month: 'Feb', balance: 35000 },
  { month: 'Mar', balance: 38000 },
  { month: 'Apr', balance: 41000 },
  { month: 'May', balance: 43000 },
  { month: 'Jun', balance: 45231 },
];

export function AccountOverview() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-foreground">Account Overview</CardTitle>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-3xl font-bold text-foreground">$45,231.89</p>
            <p className="text-muted-foreground">Net Worth</p>
          </div>
          <div className="text-green-600 text-sm font-medium">
            +$3,231.89 this month
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                className="text-muted-foreground" 
                fontSize={12}
              />
              <YAxis 
                className="text-muted-foreground" 
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Bar 
                dataKey="balance" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}