'use client';

import React, { ChangeEvent, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopPodEditCardProps {
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  name: string;
  setName: (value: string) => void;
  type: string;
  description: string;
  setDescription: (value: string) => void;
  loading: boolean;
}

const TopPodEditCard: React.FC<TopPodEditCardProps> = ({
  handleSubmit,
  name,
  setName,
  type,
  description,
  setDescription,
  loading
}) => {
  return (
    <Card style={{ backgroundColor: "var(--card)" }}>
      <CardHeader>
        <CardTitle>Edit Pod</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Update your pod details. The pod type cannot be changed once created.
        </p>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Pod Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Enter pod name"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Pod Type</Label>
            <Select value={type} disabled>
              <SelectTrigger>
                <SelectValue placeholder="Select pod type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Property Listing">Property Listing</SelectItem>
                <SelectItem value="Insurance Policy">Insurance Policy</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Pod type cannot be changed once created.
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Enter a description"
              rows={4}
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Pod'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default TopPodEditCard;
